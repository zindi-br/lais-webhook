const { aposAvaliacao, enviarMensagemCanal } = require("../helpers/chat.helper");
const { soNumeros } = require("../utils/functions");
const { v2_ai_flow_checkMessageType } = require("./flows/v2.ai.flow.function");
const { v3_ai_flow_checkMessageType } = require("./flows/v3.ai.flow.function");

async function handleAvaliacao(message, responseChat, clienteId, dataWebhooks, isWebhookCustom, session, responseClient, channel, aiAgent, clientePaiId) {

    const notasAvaliacoes = ["1", "2", "3", "4", "5"];
    let platform = channel?.platform;
    const msgBoasVindas = responseClient?.config?.msgBoasVindas;
    if (notasAvaliacoes.includes(message.body)) {
        await aposAvaliacao(soNumeros(message.chatId), message.body, "", responseChat._id, clienteId, responseChat.output_pesquisa, responseChat.fv_lead_id, dataWebhooks, isWebhookCustom, null, {
            clienteId: clientePaiId,
            messageText: message.body,
            messageType: message.type
        } );
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
            canal:platform
        })
    } else {
        await aposAvaliacao(soNumeros(message.chatId), message.body, "", responseChat._id, clienteId, responseChat.output_pesquisa, responseChat.fv_lead_id, null, isWebhookCustom);
        if (channel?.webhook_type === 'laisai_v2') {
            return v2_ai_flow_checkMessageType(message, channel, responseChat, aiAgent, clientePaiId)
        } else if (channel?.webhook_type === 'laisai_v3') {
            return v3_ai_flow_checkMessageType(message, channel, responseChat, aiAgent, clientePaiId)
        } else {
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
}

module.exports = {
    handleAvaliacao
}