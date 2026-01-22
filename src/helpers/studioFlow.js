const { response } = require("express");
const { actionStartFlowBuilder, actionContinueFlowBuilder } = require("../actions/flowbuilder.action");
const Chats = require("../models/Chats");
const { verificarBarraBot, enviarMensagemCanal, alterarFotoPerfil, criarChat, aposAvaliacao, enviarMensagemArquivoCanal, enviarDigitando, createAiOrderLead } = require("./chat.helper");
const { soNumeros, convertUrlToBase64 } = require("../utils/functions");
const { registrarBarraBot, getFluxo } = require("../services/functions");
const mongoose = require("../models/mongoose");
const { refineAudioToText } = require("./gpt.helper");
const Flows = require("../models/Flows");
const ForcaVendasLead = require("../models/ForcaVendasLead");
const { processReadImage } = require("./ai.helper");

const notasAvaliacoes = ["1", "2", "3", "4", "5"];

const isAudioMessage = ["audio", "ptt"];
const isFile = ["image", "video", "document", "ptt"];


const messageBufferPerChatId = new Map();
const messageTimeouts = new Map();
const TIMEOUT_DURATION = 20000; // 9 segundos para o timeout

async function processFlow(chat, message, text, channel, flow) {
    const chatId = message.chatId + "_" + channel.clienteId;

    // Adiciona a mensagem atual ao buffer
    if (!messageBufferPerChatId.has(chatId)) {
        messageBufferPerChatId.set(chatId, []);
    }
    messageBufferPerChatId.get(chatId).push(text);

    // Limpa o timeout existente se houver
    if (messageTimeouts.has(chatId)) {
        clearTimeout(messageTimeouts.get(chatId));
    }

    // messageTimeouts.set(chatId, setTimeout(async () => {
    //     const allMessages = messageBufferPerChatId.get(chatId).map(msg => `${msg}`).join(' \n');

    //     console.log('Inicio do processamento do flowbuilder...');
    //     const responseFlow = await flowBuilderInit(chat?._id, flow, message, allMessages, channel);

    //     if (responseFlow) {
    //         transformFlowContent(responseFlow.messages, message, channel?.config.sessao);
    //     }

    //     // Verifica se novas mensagens chegaram enquanto o buffer estava sendo processado
    //     const remainingMessages = messageBufferPerChatId.get(chatId).slice(1);
    //     if (remainingMessages.length > 0) {
    //         // Atualiza o buffer com as novas mensagens não processadas
    //         messageBufferPerChatId.set(chatId, remainingMessages);
    //         processFlow(chat, message, remainingMessages.join(' \n'), channel, flow); // Chama a função novamente para processar as mensagens pendentes
    //     } else {
    //         // Limpa o buffer e remove o timeout deste chatId após o processamento
    //         messageBufferPerChatId.delete(chatId);
    //         messageTimeouts.delete(chatId);
    //     }
    // }, TIMEOUT_DURATION));

    // Define um novo timeout
    messageTimeouts.set(chatId, setTimeout(async () => {
        // Obtém todas as mensagens no buffer para esse chatId e as concatena com o prefixo adequado
        const allMessages = messageBufferPerChatId.get(chatId).map(msg => `${msg}`).join(' \n');

        console.log('mensagens aplicadas', allMessages)
        console.log('Inicio do processamento do flowbuilder...');
        const responseFlow = await flowBuilderInit(chat?._id, flow, message, allMessages, channel);
        console.log('responseFlow', responseFlow)
        if (responseFlow) {
            await transformFlowContent(responseFlow.messages, message, channel?.config.sessao, channel?.platform);
        }
        // Limpa o buffer e remove o timeout deste chatId após o processamento
        messageBufferPerChatId.delete(chatId);
        messageTimeouts.delete(chatId);
    }, TIMEOUT_DURATION));

    console.log('Aguardando novas mensagens...');
}


async function processReadAudio(message, channel) {
    const res = await refineAudioToText(message, channel);
    return res;
}

async function checkMessageType(message, channel, chat, flow) {
    const platform = channel?.platform;
    switch (true) {
        case message.type === "chat":
            let textMsg = message.body;
            if (message.type === 'ciphertext') {
                text = "Olá";
            }
            processFlow(chat, message, textMsg, channel, flow);
            break;
        case isAudioMessage.includes(message.type):
            if (flow?.config?.allowsInChat.includes("audio")) {
                const responseAudioTranscript = await processReadAudio(message, channel);
                console.log('audio', responseAudioTranscript)
                if (!responseAudioTranscript) {
                    await enviarMensagemCanal({
                        phone: soNumeros(message.from),
                        message: "Desculpe, não consegui entender seu audio, pode enviar uma mensagem de texto?",
                        session: channel?.config?.sessao,
                        canal: platform
                    });
                    return;
                };
                processFlow(chat, message, responseAudioTranscript, channel, flow);
            } else {
                let messageBreak = flow?.config?.messages?.msgBreakAudios || "Desculpe, não é possível enviar audios";
                //  await enviarMensagemCanal(soNumeros(message.from), messageBreak, channel?.config?.sessao, "whatsapp");
            }
            break;
        case isFile.includes(message.type):
            console.log('file', message.type)
            if (flow?.config?.allowsInChat.includes("image")) {
                // envio de arquivos
                const responseImageTranscript = await processReadImage(
                    channel.config?.sessao,
                    flow?.config?.credentialId,
                    channel?.clienteId,
                    message.id,
                    message
                );
                if (responseImageTranscript) {
                    await processFlow(chat, message, responseImageTranscript, channel, flow);
                } else {
                    await enviarMensagemCanal({
                        phone: soNumeros(message.from),
                        message: "Desculpe, não consegue ver sua imagem, pode enviar uma mensagem de texto?",
                        session: channel?.config?.sessao,
                        canal: platform
                    });
                }
            } else {
                let messageBreak = flow?.config?.messages?.msgBreakFiles || "Desculpe, não é possível enviar arquivos";
                await enviarMensagemCanal({
                    phone: soNumeros(message.from),
                    message: messageBreak,
                    session: channel?.config?.sessao,
                    canal: platform
                });
            }
            break
        default:
            return;
    }
}

async function handleAvaliacao(message, responseChat, clienteId, dataWebhooks, isWebhookCustom, session, responseClient, clientePaiId) {
    await aposAvaliacao(soNumeros(message.chatId), message.body, "", responseChat._id, clienteId, responseChat.output_pesquisa, responseChat.fv_lead_id, dataWebhooks, isWebhookCustom, null,
        {
            clienteId: clientePaiId,
            messageText: message.body,
            messageType: message.type
        });
    if (!notasAvaliacoes.includes(message.body)) return true
    await enviarMensagemCanal({
        phone: responseChat.numeroCliente,
        message: "Agradecemos sua participação!",
        session: session,
        canal: responseChat?.canal
    });
    // promisse aguardando 3 segundos
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await enviarMensagemCanal({
        phone: responseChat.numeroCliente,
        message: "👋 Até logo",
        session: session,
        canal: responseChat?.canal
    });
    return false;
}


const webhookStudioFlow = async (
    clienteId,
    fotoPerfil,
    session,
    responseChat,
    responseClient,
    message,
    dataWebhooks,
    responseChannel,
    nomeContato,
    clientePaiId,
    firstMessage
) => {
    // const barra_bot = await verificarBarraBot(session, soNumeros(message.from)); // registra para barrar bot
    // if (barra_bot) return; // se for bot finaliza

    const flow = await Flows.findById(responseChannel?.config?.flowbuilder?.flowId);


    // altera foto de perfil
    alterarFotoPerfil(responseChat, message);

    if (!responseChat) {
        const responseChatCreated = await criarChat(
            "Geral", true, soNumeros(message.from), clienteId, "", "", nomeContato, fotoPerfil, message.body,
            {
                clienteId: clientePaiId,
                messageText: message.body,
                messageType: message.type,
                sessao: responseClient?.sessao
            },
            firstMessage,
            responseChannel,
            {
                chatNotExist: true
            }
        );
        await checkMessageType(message, responseChannel, responseChatCreated, flow);
        await createAiOrderLead({ chat: responseChatCreated, channel: responseChannel, persistCreate: false });
        return;
    }

    if (responseChat?.chatbot && responseChat.statusRoom !== 'Atendendo' && responseChat.statusRoom !== 'Pendente') {
        await checkMessageType(message, responseChannel, responseChat, flow);
        await createAiOrderLead({ chat: responseChat, channel: responseChannel, persistCreate: false });
        await criarChat(
            "Geral",
            true,
            soNumeros(message.from),
            clienteId,
            "",
            "",
            nomeContato,
            fotoPerfil,
            message.body,
            {
                clienteId: clientePaiId,
                messageText: message.body,
                messageType: message.type,
                sessao: responseClient?.sessao
            },
            firstMessage,
            responseChannel
        );
        return;
    }

    if (!responseChat?.chatbot && responseChat.statusRoom === "Avaliando") {
        const responseFeedback = await handleAvaliacao(message, responseChat, clienteId, dataWebhooks, false, session, responseClient, clientePaiId);
        if (responseFeedback) {
            await checkMessageType(message, responseChannel, responseChat, flow);
            await createAiOrderLead({ chat: responseChat, channel: responseChannel, persistCreate: false });
        }
    }
}



const transformFlowContent = async (data, message, session, platform) => {

    // Função para extrair e formatar o texto
    function formatResponse(response) {
        let texts = []; // Array para armazenar os textos completos
        // Função recursiva para extrair e formatar texto de qualquer nível de profundidade
        function extractText(element) {
            if (element.text) {
                return element.text; // Retorna o texto normal se não estiver em negrito
            } else if (element.children) {
                if (element.type === 'ul') {
                    // Se for uma lista, junte todos os itens com quebra de linha
                    return element.children.map(child => extractText(child)).join('\n');
                } else if (element.type === 'li' || element.type === 'lic') {
                    // Adiciona quebra de linha após cada item de lista
                    return element.children.map(child => extractText(child)).join('') + '\n';
                } else if (element.type === 'p') {
                    // Adiciona quebra de linha entre parágrafos
                    return element.children.map(child => extractText(child)).join('') + '\n';
                } else {
                    // Concatena textos de outros elementos filhos
                    return element.children.map(child => extractText(child)).join('');
                }
            }
            return ''; // Retorna string vazia se não houver texto ou children
        }

        response.forEach(block => {
            let blockText = block.children.map(element => {
                // Processa cada elemento e adiciona o resultado ao array final se não for vazio
                let text = extractText(element);
                if (text.trim() !== '') return text;
                return null;
            }).filter(text => text !== null); // Remove entradas nulas que podem ocorrer com strings vazias

            texts = texts.concat(blockText); // Concatena os textos processados ao array principal
        });

        // Junta os textos e remove espaços extras
        texts = texts.map(text => text.trim());

        // Agrupa os itens de balas em um único item se estiverem juntos no mesmo parágrafo
        let finalTexts = [];
        let buffer = [];

        texts.forEach(text => {
            if (text.includes('R$')) {
                buffer.push(text);
            } else {
                if (buffer.length > 0) {
                    finalTexts.push(buffer.join('\n'));
                    buffer = [];
                }
                finalTexts.push(text);
            }
        });

        if (buffer.length > 0) {
            finalTexts.push(buffer.join('\n'));
        }

        return finalTexts; // Retorna o array de textos completos
    }






    data.forEach(async (item) => {
        if (item.type === 'text') {
            if (item.content && item.content.richText && item.content.richText.length > 0) {

                let messages = formatResponse(item.content.richText);

                for (const msg of messages) {
                    const dynamicDelay = msg.length * 10;
                    enviarDigitando({ phone: soNumeros(message.from), value: true, session, platform });
                    await new Promise((resolve) => setTimeout(resolve, dynamicDelay));

                    await enviarMensagemCanal({
                        phone: soNumeros(message.from),
                        message: msg,
                        session: session,
                        canal: platform
                    });
                }
                await enviarDigitando({ phone: soNumeros(message.from), value: false, session, platform });

                for (const messagetext of messages) {
                    //// enviando ao canal
                }
            }
        } else if (item.type === 'image') {
            const base64 = await convertUrlToBase64(item.content.url);
            const base64Format = `data:image/png;base64,${base64}`;
            await enviarMensagemArquivoCanal(soNumeros(message.from), base64Format, session, platform);
        }

    });
}

const flowBuilderInit = async (chatId, flow, message, text, channel) => {
    let agg = [
        {
            $match: {
                _id: mongoose.Types.ObjectId(chatId)
            }
        },
        {
            $lookup: {
                from: "contatos",
                localField: "contato_id",
                foreignField: "_id",
                as: "contato"
            }
        },
        {
            $unwind: {
                path: "$contato",
                preserveNullAndEmptyArrays: true
            }
        }
    ];

    const responseChatAgg = await Chats.aggregate(agg);
    const responseChat = await responseChatAgg[0];
    const data = { message: text };

    const nomeContato = responseChat?.nomeCliente || responseChat?.contato?.nome || null;

    const dataInit = {
        prefilledVariables: {
            numeroCliente: soNumeros(message.chatId),
            chatId: chatId,
            sessao: channel?.config.sessao,
            nomeContato: nomeContato,
            clienteId: channel?.clienteId,
            varChat: flow?.config?.varChat || {},
            promptValues: flow?.config?.promptValues || {}
        }
    }

    async function initFlow(sessionId, data) {
        try {
            const responseStartFlow = await actionContinueFlowBuilder(sessionId, data);
            return responseStartFlow
        } catch (error) {
            console.log(error)
        }

    }

    if (responseChat) {
        if (responseChat.sessionFlowId) {
            try {
                const sessionFlowId = responseChat.sessionFlowId;

                const responseContinueFlow = await initFlow(sessionFlowId, data);
                return responseContinueFlow.data
            } catch (error) {
                console.log('erro ao iniciar o flow', error.response.data)
            }

        } else {
            try {
                const responseStartFlow = await actionStartFlowBuilder(flow?.config?.flowPublicId, dataInit);
                if (responseStartFlow.status === 200) {
                    await Chats.updateOne({ _id: responseChat._id }, { sessionFlowId: responseStartFlow.data.sessionId });
                    const responseContinueFlow = await initFlow(responseStartFlow.data.sessionId, data);
                    return responseContinueFlow.data
                }
            } catch (error) {
                console.log('erro ao iniciar o flow', error.response.data)
            }
        }
    } else {
        console.log('nao tem chat repsonse aqui')
    }
}



module.exports = {
    flowBuilderInit,
    webhookStudioFlow
}