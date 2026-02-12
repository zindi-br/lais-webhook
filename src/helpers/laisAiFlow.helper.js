const { response } = require("express");
const { actionStartFlowBuilder, actionContinueFlowBuilder } = require("../actions/flowbuilder.action");
const Chats = require("../models/Chats");
const { checkDelayMsgs, verificarBarraBot, enviarMensagemCanal, alterarFotoPerfil, criarChat, enviarMensagemArquivoCanal, enviarDigitando, aposAvaliacao } = require("./chat.helper");
const { soNumeros, convertUrlToBase64 } = require("../utils/functions");
const { registrarBarraBot, getFluxo, incrDelayAi, saveMessageToRedis, setRedis, getRedis } = require("../services/functions");
const mongoose = require("../models/mongoose");
const { refineAudioToText } = require("./gpt.helper");
const Flows = require("../models/Flows");
const ForcaVendasLead = require("../models/ForcaVendasLead");
const { actionPredictionSimpleAi } = require("../actions/ai.action");
const notasAvaliacoes = ["1", "2", "3", "4", "5"];

const isAudioMessage = ["audio", "ptt"];
const isFile = ["image", "video", "document", "ptt"];


async function processReadAudio(message, channel) {
    const res = await refineAudioToText(message, channel);
    return res;
}

async function checkMessageType(message, channel, chat, aiConfig) {
    let platform = channel?.platform;
    switch (true) {
        case message.type === "chat":
            processFlow(chat, message, message.body, channel);
            break;
        case isAudioMessage.includes(message.type):
            if (aiConfig?.allowsInChat.includes("audio") || aiConfig?.allowsInChat.includes("ptt")) {
                if (aiConfig?.provider === "gemini") {
                    let messageBreak = aiConfig?.config?.messages?.msgBreakAudios || "Desculpe, não é possível enviar audios";
                    await enviarMensagemCanal({
                        phone: soNumeros(message.from), 
                        message: messageBreak, 
                        session: channel?.config?.sessao, 
                        canal: platform
                    });
                } else {
                    const responseAudioTranscript = await processReadAudio(message, channel);
                    if (responseAudioTranscript) {
                        processFlow(chat, message, responseAudioTranscript, channel);
                    } else {
                        await enviarMensagemCanal({
                            phone: soNumeros(message.from), 
                            message: "Desculpe, não consegui entender seu audio, pode enviar uma mensagem de texto??", 
                            session: channel?.config?.sessao, 
                            canal: platform
                        });
                        return;
                    }

                }
            } else {
                let messageBreak = aiConfig?.config?.messages?.msgBreakAudios || "Desculpe, não é possível enviar audios";
                await enviarMensagemCanal({
                    phone: soNumeros(message.from), 
                    message: messageBreak, 
                    session: channel?.config?.sessao, 
                    canal: platform
                });
            }
            break;
        case isFile.includes(message.type):
            if (aiConfig?.allowsInChat.includes("arquivos")) {
                // envio de arquivos
            } else {
                let messageBreak = aiConfig?.config?.messages?.msgBreakFiles || "Desculpe, não é possível enviar arquivos";
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

    const msgBoasVindas = responseClient?.config?.msgBoasVindas;
    if (notasAvaliacoes.includes(message.body)) {
        await aposAvaliacao(soNumeros(message.chatId), message.body, "", responseChat._id, clienteId, responseChat.output_pesquisa, responseChat.fv_lead_id, dataWebhooks, isWebhookCustom, null,
        {
            clienteId: clientePaiId,
            messageText: message.body,
            messageType: message.type
        });
        await enviarMensagemCanal({
            phone: responseChat.numeroCliente, 
            message: "Agradecemos sua participação!", 
            session: session, 
            canal: platform
        })
        await enviarMensagemCanal({
            phone: responseChat.numeroCliente, 
            message: "👋 Até logo", 
            session: session, 
            canal: platform
        })
    } else {
        await aposAvaliacao(soNumeros(message.chatId), message.body, "", responseChat._id, clienteId, responseChat.output_pesquisa, responseChat.fv_lead_id, dataWebhooks, isWebhookCustom);
        if (msgBoasVindas !== "") {
            await enviarMensagemCanal({
                phone: responseChat.numeroCliente, 
                message: msgBoasVindas, 
                session: session, 
                canal: platform
            });
        }
    }

}



const webhookLaisAiFlow = async (
    clienteId,
    fotoPerfil,
    session,
    responseChat,
    responseClient,
    message,
    dataWebhooks,
    responseChannel,
    nomeContato,
    clientePaiId
) => {
    const barra_bot = await verificarBarraBot(session, soNumeros(message.from)); // registra para barrar bot
    if (barra_bot) return; // se for bot finaliza
    const aiConfig = await responseChannel?.config?.ai;
    const isWebhookCustom = responseChannel?.webhook_type === 'custom';

    // altera foto de perfil
    alterarFotoPerfil(responseChat, message);

    if (!responseChat) {
        const responseChatCreated = await criarChat(
            "Geral", 
            true, 
            soNumeros(message.from), 
            clienteId, 
            "", 
            "", 
            nomeContato, 
            fotoPerfil, 
            message.body, 
            null, 
            null, 
            responseChannel
        );
        const responseCallFluxo = await getFluxo(message.body, clientePaiId, soNumeros(message.from), responseChatCreated._id);

        if (responseCallFluxo) {
            await criarChat(
                "Pendente", 
                false, 
                soNumeros(message.from), 
                clienteId, 
                responseCallFluxo.direciona_usuarios || [], 
                responseCallFluxo.direciona_setores || [], 
                nomeContato, 
                fotoPerfil, 
                message.body,
                responseChannel
            ); /// cadastra cliente no banco de dados    
            await enviarMensagemCanal({
                phone: soNumeros(message.from), 
                message: responseChannel?.config?.ai?.messages?.msgAfterTargeting, 
                session: responseChannel.config?.sessao, 
                canal: platform
            })
            return;
        } else {
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
                null, 
                null, 
                responseChannel,
                {
                    chatNotExist: true
                }
            )
        }
        await checkMessageType(message, responseChannel, responseChatCreated, aiConfig);
        return;
    }

    if (responseChat?.chatbot && responseChat.statusRoom !== 'Atendendo' && responseChat.statusRoom !== 'Pendente') {
        const responseCallFluxo = await getFluxo(message.body, clientePaiId, soNumeros(message.from), responseChat._id);
        if (responseCallFluxo) {
            await criarChat(
                "Pendente", 
                false, 
                soNumeros(message.from), 
                clienteId, 
                responseCallFluxo.direciona_usuarios || [], 
                responseCallFluxo.direciona_setores || [], 
                nomeContato, 
                fotoPerfil, 
                message.body, 
                null, 
                null, 
                responseChannel
            ); /// cadastra cliente no banco de dados    
            await enviarMensagemCanal({
                phone: soNumeros(message.from), 
                message: responseChannel?.config?.ai?.messages?.msgAfterTargeting, 
                session: responseChannel.config?.sessao, 
                canal: platform
            })
            return;
        } else {
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
                 null, 
                 null, 
                 responseChannel
                )
        }
        await checkMessageType(message, responseChannel, responseChat, aiConfig);
        return;
    }

    if (!responseChat?.chatbot && responseChat.statusRoom === "Avaliando") {
        await handleAvaliacao(message, responseChat, clienteId, dataWebhooks, isWebhookCustom, session, responseClient, clientePaiId);
    }
}

// Map global para armazenar buffers e timeouts
const messageBufferPerChatId = new Map();
const messageTimeouts = new Map();
const TIMEOUT_DURATION = 15000; // 15 segundos para o timeout

async function processFlow(chat, message, text, channel) {
    const chatId = message.chatId;
    let platform = channel?.platform;

    // Adiciona a mensagem atual ao buffer
    if (!messageBufferPerChatId.has(chatId)) {
        messageBufferPerChatId.set(chatId, []);
    }
    messageBufferPerChatId.get(chatId).push(message.body);

    // Limpa o timeout existente se houver
    if (messageTimeouts.has(chatId)) {
        clearTimeout(messageTimeouts.get(chatId));
    }

    // Define um novo timeout
    messageTimeouts.set(chatId, setTimeout(async() => {
        // Obtém todas as mensagens no buffer para esse chatId e as concatena com o prefixo adequado
        const allMessages = messageBufferPerChatId.get(chatId).map(msg => `${msg}`).join(' \n');
        let data = {
            "provider": channel?.config?.ai?.provider,
            "scope": {
                "chatId": chatId,
                "message": allMessages
            }
        }
        const responseFlow = await actionPredictionSimpleAi(channel?.config.sessao, data);
        const messages = responseFlow.data.data;
         // Limpa o buffer e remove o timeout deste chatId após o processamento
         messageBufferPerChatId.delete(chatId);
         messageTimeouts.delete(chatId);
        for (const msg of messages) {
            const dynamicDelay = msg.length * 50;
            enviarDigitando({phone:soNumeros(message.from), value:true, session:channel?.config.sessao, platform});
            await new Promise((resolve) => setTimeout(resolve, dynamicDelay));

            if (!msg.trim()) {
                await enviarDigitando({phone:soNumeros(message.from), value:false, session:channel?.config.sessao, platform});
                return;
            }
            await enviarMensagemCanal({
                phone: soNumeros(message.from), 
                message: msg.trimStart(), 
                session: channel?.config.sessao, 
                canal: platform
            });
        }
        await enviarDigitando({phone:soNumeros(message.from), value:false, session:channel?.config.sessao, platform});
    }, TIMEOUT_DURATION));

    console.log('Aguardando novas mensagens...');
}


module.exports = {
    webhookLaisAiFlow
}

// MAP
// WEBHOOK LAIS FLOW >> laisFlowInit >> processFlow >> flowBuilderInit