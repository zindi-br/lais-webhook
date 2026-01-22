const { actionEnviarSocketUsuarioFront } = require("../actions/socket.actions");
const MensagensInstragam = require("../models/MensagensInstragam");
const { getInfoInstagramUser, getInfoInstagramUserAndUpdate, updateDateLastMessageInstagram } = require("../services/meta.services");
const { oldFlowForInstagram } = require("../services/oldFlow");
const { validaIsMultisession } = require("../utils/functions");
const { getInfoChat, atualizarAtividade, atualizarNovaMensagem, createChat } = require("./chat.helper");
const { loadWebhook, loadDataCliente } = require("./webhook.helper");





exports.webhookMetaInstagram = async (responseCanal, message) => {
    const { cliente_id, sessao } = responseCanal;
    const data_webhooks = await loadWebhook(cliente_id, sessao);
    const dataCliente = await loadDataCliente(cliente_id);
    const cliente_id_pai = await validaIsMultisession(dataCliente, cliente_id);
    const isRead = message.message.read;
    const isDeleted = message.message.message.is_deleted;

    if(isDeleted) {
      return await MensagensInstragam.updateOne({ "message.message.mid": message.message.message.mid }, { $set: { "message.message.is_deleted": true } });
    }

    if (isRead) {
        return await MensagensInstragam.updateOne({ "message.message.mid": message.message.read.mid }, { $set: { "message.isRead": true } });
    }

    const instagramUserId = !message.message.isMe ? message.message.sender.id : message.message.recipient.id;
    const isMe = message.message.isMe;
    const isFile = message.message.isFile;

    let scope = { cliente_id: cliente_id, "instagramUser.id": instagramUserId };
    const responseChat = await getInfoChat({ cliente_id: cliente_id, "instagramUser.id": instagramUserId });

    console.log('responseChat', responseChat)

    if (responseChat && !responseChat?.instagramUser?.profile) {
        console.log('atualizando perfil')
        await getInfoInstagramUserAndUpdate(instagramUserId, sessao, responseChat)
    }

    if (!isMe && responseChat) {
        updateDateLastMessageInstagram(responseChat._id)
    }
    
    await oldFlowForInstagram(responseChat, responseCanal.webhook_type, responseCanal, message, dataCliente, data_webhooks, cliente_id_pai, isMe, isFile, instagramUserId);
    // acionar oldFlow aqui
    // aqui
  

}