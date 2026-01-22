
const { sendEventWebhook } = require('../helpers/webhook.helper');
const { soNumeros } = require('../utils/functions');


const webhookWppTextClientInit = async (
    message,
    dataWebhooks,
    session,
    chat
) => {

    function validaNome() {
        const nomeContato = message.pushname || message.sender?.pushname;
        return chat?.nomeCliente || nomeContato;
    }

    try {
        let data_evento = {
            "event": "wpp_text_client_init",
            "payload": {
                "session": session, // ID da sessão
                "cliente_id": dataWebhooks.cliente_id, // ID do cliente
                "params": ["client_send", "only_text"],
                "number": soNumeros(message?.from) , // Numero do cliente
                "date":new Date(),  // Data timezone UTC
                "chatName":validaNome(),
                "content":message?.body, // Conteudo da mensagem,
                "is_me": message?.fromMe ? true : false, // Se a mensagem foi enviada pelo cliente
                "chatId": soNumeros(message?.chatId), // ID do chat
              }
        }   
        sendEventWebhook(data_evento, dataWebhooks.url, dataWebhooks.method)
    } catch (error) {
        console.log('erro ao fazer requisição apos validação', error);
    }
}


       
module.exports = {
    webhookWppTextClientInit
  };

