const { enviarMensagemCanal, alterarFotoPerfil, criarChat, verifyStandbyUser } = require("../helpers/chat.helper");
const { soNumeros } = require("../utils/functions");
const { getFluxo } = require("../services/functions");
const { executeAutomate } = require("../services/automate.service");
const { handleAvaliacao } = require("../functions/feedback.function");
const { v3_processChatbotFlow } = require('../functions/flows/v3.chatbotFlow.function')

const mainChatbotFlow = async ({
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
    findFirstMessage
}) => {
    const platform = responseChannel?.platform;
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
            {
                clienteId: clientePaiId,
                messageText: message.body,
                messageType: message.type
            },
            findFirstMessage,
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
                {
                    clienteId: clientePaiId,
                    messageText: message.body,
                    messageType: message.type,
                    session: session
                },
                findFirstMessage,
                responseChannel,
                {
                    chatNotExist: true
                }
            ); /// cadastra cliente no banco de dados    
            await enviarMensagemCanal({
                phone: soNumeros(message.from),
                message: responseChannel?.config?.ai?.messages?.msgAfterTargeting,
                session: responseChannel.config?.sessao,
                canal: platform
            })
            return;
        } else {
            const reponse_chat_2 = await criarChat(
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
                    session: session
                },
                findFirstMessage,
                responseChannel,
                {
                    chatNotExist: true
                }
            );
            if (reponse_chat_2 && message.type === "chat") {
                executeAutomate(clientePaiId, ["from.chat.contains"], {
                    ...reponse_chat_2,
                    numero: reponse_chat_2?.numeroCliente,
                    nome: reponse_chat_2?.nomeCliente,
                    chatStatus: reponse_chat_2.statusRoom,
                    chatId: reponse_chat_2._id,
                    chatClientId: reponse_chat_2.cliente_id,
                    cliente_id: clientePaiId,
                    messageText: message.body,
                    messageType: message.type,
                    sessao: session,
                    usuariosIds: reponse_chat_2?.direciona_usuarios,
                    setoresIds: reponse_chat_2?.direciona_setores,
                    ai_order_lead_id: reponse_chat_2?.ai_order_lead_id,
                    fromMe: false
                });
            }
            responseChat = reponse_chat_2;
        }

        await v3_processChatbotFlow({ chat: responseChat, message: message, channel: responseChannel });
        return;
    }

    if (responseChat?.statusRoom === "Atendendo" && responseChat?.direciona_usuarios.length > 0) {
        verifyStandbyUser(responseChat.direciona_usuarios[0], responseChat, session);
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
                {
                    clienteId: clientePaiId,
                    messageText: message.body,
                    messageType: message.type,
                    session: session
                },
                findFirstMessage,
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
              responseChat = await criarChat(
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
                    session: session
                },
                findFirstMessage,
                responseChannel
            );

         
        }

        await v3_processChatbotFlow({ chat: responseChat, message: message, channel: responseChannel });
        return;
    }

    if (!responseChat?.chatbot && responseChat.statusRoom === "Avaliando") {
        await handleAvaliacao(message, responseChat, clienteId, dataWebhooks, false, session, responseClient, responseChannel, aiAgent, clientePaiId);
    }
}



module.exports = {
    mainChatbotFlow
}

