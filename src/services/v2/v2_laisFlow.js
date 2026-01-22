const { enviarMensagemCanal, alterarFotoPerfil, criarChat, verifyStandbyUser } = require("../../helpers/chat.helper");
const { soNumeros } = require("../../utils/functions");
const { getFluxo } = require("../functions");
const { getDataAiAgent } = require("../fetchsDb/channels");
const { handleAvaliacao } = require("../../functions/feedback.function");
const { v2_ai_flow_checkMessageType } = require("../../functions/flows/v2.ai.flow.function");

const v2LaisAiFlow = async (
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
) => {
    // const barra_bot = await verificarBarraBot(session, soNumeros(message.from)); // registra para barrar bot
    // if (barra_bot) return; // se for bot finaliza
    //const aiConfig = await responseChannel?.config?.ai;
    const aiAgent = await getDataAiAgent(responseChannel?.config?.laisai_v2.ai_agent_id, false);
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
            {
            clienteId:clientePaiId,
            messageText: message.body,
            messageType: message.type,
            sessao:session
        },
        findFirstMessage,
        responseChannel,
        {
            chatNotExist: true
        }
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
                canal: responseChannel?.platform
            })
            return;
        } else {
            // Não precisa criar novamente, só usar o chat já criado
        }
        await v2_ai_flow_checkMessageType(message, responseChannel, responseChatCreated, aiAgent, clientePaiId);
        return;
    }

    if (responseChat?.statusRoom === "Atendendo" && responseChat?.direciona_usuarios.length > 0) {
        verifyStandbyUser(responseChat.direciona_usuarios[0], responseChat, session);
        return;
    }

    if (
        responseChat?.chatbot && 
        responseChat.statusRoom !== 'Atendendo' && 
        responseChat.statusRoom !== 'Pendente') {
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
                canal: responseChannel?.platform
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
                {
                    clienteId: clientePaiId,
                    messageText: message.body,
                    messageType: message.type,
                    session: session
                },
                findFirstMessage,
                responseChannel
            )
        }
        await v2_ai_flow_checkMessageType(message, responseChannel, responseChat, aiAgent, clientePaiId);
        return;
    }

    if (!responseChat?.chatbot && responseChat.statusRoom === "Avaliando") {
        await handleAvaliacao(message, responseChat, clienteId, dataWebhooks, isWebhookCustom, session, responseClient, responseChannel, aiAgent, clientePaiId);
    }
}



module.exports = {
    v2LaisAiFlow
}

// MAP
// WEBHOOK LAIS FLOW >> laisFlowInit >> processFlow >> flowBuilderInit