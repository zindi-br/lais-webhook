const { v3_actionAgentsPrediction, v3_actionAgentsFlow } = require("../../actions/ai.action");
const { textToSpeech, processReadImage, processReadAudio } = require("../../helpers/ai.helper");
const { enviarDigitando, enviarMensagemCanal, enviarMensagemAudioVoz } = require("../../helpers/chat.helper");
const { soNumeros } = require("../../utils/functions");

const isAudioMessage = ["audio", "ptt"];
const isFile = ["video", "document"];
const isImage = ["image"];

// Map global para armazenar buffers e timeouts
const messageBufferPerChatId = new Map();
const messageTimeouts = new Map();

async function processFlow(scope) {
    const { chat, message, text, channel, aiAgent, isAgentFlow } = scope;
    const chatId = message.chatId;
    const TIMEOUT_DURATION = aiAgent?.config?.generalConfig.timeListenMsgs * 1000 || 15 * 1000;
    let platform = channel?.platform;

    // Adiciona a mensagem atual ao buffer
    if (!messageBufferPerChatId.has(chatId)) {
        messageBufferPerChatId.set(chatId, []);
    }
    // if(message.type === "audio" || message.type === "ptt"){
    messageBufferPerChatId.get(chatId).push(message.body);

    // Limpa o timeout existente se houver
    if (messageTimeouts.has(chatId)) {
        clearTimeout(messageTimeouts.get(chatId));
    }

    // Define um novo timeout
    messageTimeouts.set(chatId, setTimeout(async () => {
        // Obtém todas as mensagens no buffer para esse chatId e as concatena com o prefixo adequado
        const allMessages = messageBufferPerChatId.get(chatId).map(msg => `${msg}`).join(' \n');
        let data = {
            "provider": aiAgent?.config?.generalConfig.provider,
            "scope": {
                "chatId": chatId,
                "chat": chat,
                "message": allMessages,
                "typeMsg": message?.type,
                "ai_order_lead_id": chat?.ai_order_lead_id
            }
        }

        try {
            let responseFlow;
            if (isAgentFlow) {
                responseFlow = await v3_actionAgentsFlow(channel?.config.sessao, data, aiAgent._id);
            } else {
                responseFlow = await v3_actionAgentsPrediction(channel?.config.sessao, data, aiAgent._id);
            }
            const messages = responseFlow.data.data;
            // Limpa o buffer e remove o timeout deste chatId após o processamento
            messageBufferPerChatId.delete(chatId);
            messageTimeouts.delete(chatId);

            for (const msg of messages) {
                const delayBetweenMsgs = aiAgent?.config?.generalConfig.delayBetweenMsgs || 50;
                const dynamicDelay = msg.length * delayBetweenMsgs;
                const fromNumber = soNumeros(message.from);
                const session = channel?.config.sessao;

                await enviarDigitando({ phone: fromNumber, value: true, session, platform });
                await new Promise((resolve) => setTimeout(resolve, dynamicDelay));

                if (!msg.trim()) {
                    await enviarDigitando({ phone: fromNumber, value: false, session, platform });
                    return;
                }

                const trimmedMsg = msg.trimStart();
                const awnserAudioConfig = aiAgent?.config?.generalConfig?.awnserAudio;

                if (awnserAudioConfig === "never") {
                    await enviarMensagemCanal({
                        phone: fromNumber,
                        message: trimmedMsg,
                        session: session,
                        canal: platform
                    });

                } else if (awnserAudioConfig === "always") {
                    try {
                        const audio = await textToSpeech(trimmedMsg, aiAgent?.voices?.voice_id, channel.clienteId);
                        await enviarMensagemAudioVoz(fromNumber, audio, session, platform);
                    } catch (error) {
                        console.log('Erro ao enviar audio', error);
                        await enviarDigitando({ phone: soNumeros(message.from), value: false, session: channel?.config.sessao, platform });
                    }


                } else if (awnserAudioConfig === "responseAudio" && isAudioMessage.includes(message.type)) {
                    try {
                        const audio = await textToSpeech(trimmedMsg, aiAgent?.voices?.voice_id, channel.clienteId);
                        await enviarMensagemAudioVoz(fromNumber, audio, session, platform);
                    } catch (error) {
                        console.log('Erro ao enviar audio', error);
                        await enviarDigitando({ phone: soNumeros(message.from), value: false, session: channel?.config.sessao, platform });
                    }


                } else if (awnserAudioConfig === "random") {
                    if (responseFlow?.data.isAudio) {
                        try {
                            const audio = await textToSpeech(trimmedMsg, aiAgent?.voices?.voice_id, channel.clienteId);
                            await enviarMensagemAudioVoz(fromNumber, audio, session, platform);
                        } catch (error) {
                            console.log('Erro ao enviar audio', error);
                            await enviarDigitando({ phone: soNumeros(message.from), value: false, session: channel?.config.sessao, platform });
                        }
                    } else {
                        try {
                            await enviarMensagemCanal({
                                phone: fromNumber,
                                message: trimmedMsg,
                                session: session,
                                canal: platform
                            });
                            await enviarDigitando({ phone: soNumeros(message.from), value: false, session: channel?.config.sessao, platform });

                        } catch (error) {
                            console.log('Erro ao enviar mensagem texto', error);
                            await enviarDigitando({ phone: soNumeros(message.from), value: false, session: channel?.config.sessao, platform });
                        }
                    }
                } else {
                    await enviarMensagemCanal({
                        phone: fromNumber,
                        message: trimmedMsg,
                        session: session,
                        canal: platform
                    });
                }
            }
            await enviarDigitando({ phone: soNumeros(message.from), value: false, session: channel?.config.sessao, platform });

        } catch (err) {
            console.log('Erro ao processar o flow', err);
            await enviarDigitando({ phone: soNumeros(message.from), value: false, session: channel?.config.sessao, platform });
            return;
        }
    }, TIMEOUT_DURATION));
}



async function v3_agentsFlowInit(scope) {
    const { message, channel, chat, aiAgent, isAgentFlow, cliente_id_pai } = scope;
    let platform = channel?.platform;

    switch (true) {
        case message.type === "chat":
            processFlow({ chat, message, text: message.body, channel, aiAgent, isAgentFlow });
            break;
        case isAudioMessage.includes(message.type):
            if (aiAgent?.config?.generalConfig.allowsInChat.includes("audio") || aiAgent?.config?.generalConfig.allowsInChat.includes("ptt")) {
                if (aiAgent?.provider === "gemini") {
                    let messageBreak = aiAgent?.config?.generalConfig.messages?.msgBreakAudios || "Desculpe, não é possível enviar audios";
                    await enviarMensagemCanal({
                        phone: soNumeros(message.from),
                        message: messageBreak,
                        session: channel?.config?.sessao,
                        canal: platform
                    });
                } else {
                    const responseAudioTranscript = await processReadAudio(message, channel, aiAgent);
                    if (responseAudioTranscript) {
                        message.body = responseAudioTranscript;
                        await processFlow({ chat, message, text: responseAudioTranscript, channel, aiAgent, isAgentFlow });
                        executeAutomate(cliente_id_pai, ["from.chat.contains"], {
                            numero: chat?.numeroCliente,
                            nome: chat?.nomeCliente,
                            chatStatus: chat.statusRoom,
                            chatId: chat._id,
                            chatClientId: chat.cliente_id,
                            cliente_id: chat?.cliente_id,
                            messageText: responseAudioTranscript,
                            messageType: message.type,
                            sessao: channel?.config?.sessao,
                            usuariosIds: chat.direciona_usuarios,
                            setoresIds: chat.direciona_setores,
                            ai_order_lead_id: chat.ai_order_lead_id,
                            fromMe: message.fromMe
                        });
                    } else {
                        await enviarMensagemCanal({
                            phone: soNumeros(message.from),
                            message: "Desculpe, não consegui entender seu audio, pode enviar uma mensagem de texto?",
                            session: channel?.config?.sessao,
                            canal: platform
                        });
                        return;
                    }

                }
            } else {
                let messageBreak = aiAgent?.config?.generalConfig.messages?.msgBreakAudios || "Desculpe, não é possível enviar audios";
                await enviarMensagemCanal({
                    phone: soNumeros(message.from),
                    message: messageBreak,
                    session: channel?.config?.sessao,
                    canal: platform
                });
            }
            break;
        case isImage.includes(message.type):
            if (aiAgent?.config?.generalConfig.allowsInChat.includes("image")) {
                const responseImageTranscript = await processReadImage(
                    channel.config?.sessao,
                    aiAgent?.config?.generalConfig?.credential_id,
                    aiAgent?.cliente_id,
                    message.id,
                    message
                );
                if (responseImageTranscript) {
                    message.body = responseImageTranscript;
                    await processFlow({ chat, message, text: responseImageTranscript, channel, aiAgent, isAgentFlow });
                } else {
                    await enviarMensagemCanal({
                        phone: soNumeros(message.from),
                        message: "Desculpe, não consegui ver sua imagem, pode enviar uma mensagem de texto?",
                        session: channel?.config?.sessao,
                        canal: platform
                    });
                    return;
                }
                // envio de arquivos
            } else {
                let messageBreak = aiAgent?.config?.generalConfig.messages?.msgImages || "Desculpe, não é possível imagens por aqui";
                await enviarMensagemCanal({
                    phone: soNumeros(message.from),
                    message: messageBreak,
                    session: channel?.config?.sessao,
                    canal: platform
                });
            }
            break;
        case isFile.includes(message.type):
            if (aiAgent?.config?.generalConfig.allowsInChat.includes("video") || aiAgent?.config?.generalConfig.allowsInChat.includes("document")) {
                // envio de arquivos

            } else {
                let messageBreak = aiAgent?.config?.generalConfig.messages?.msgBreakFiles || "Desculpe, não é possível enviar arquivos por aqui";
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

module.exports = {
    v3_agentsFlowInit
}