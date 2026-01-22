/**
 * Utilitários para processamento de mensagens
 */

function checkMsgToInsert(message) {
    // verificar mensagem para inserir no historico
    switch (message.type) {
        case "chat":
            return message.body;
        case "image":
            return "📷 Imagem";
        case "ptt":
            return "🎤 Áudio";
        case "sticker":
            return "🎨 Adesivo";
        case "document":
            return "📄 Documento";
        case "video":
            return "🎥 Vídeo";
        case "location":
            return "📍 Localização";
        case "vcard":
            return "👤 Contato";
        case "url":
            return "🔗 Link";
        case "call_log":
            return "📞 Chamada";
        default:
            return "";
    }
}

function processAndTransformMessageWhatsapp(msg) {
      // verificar se  existe @lid no caht ID
  const isLid = msg?.chatId.includes('@lid');

  let number = msg?.chatId.split('@')[0];
  if(isLid) {
    number = msg?.chatId.split('@')[0]; 
  }

  let newMsg = {
    ...msg,
    isLid: isLid,
    chatLid: isLid ? msg?.chatId : null,
    chatNumber: isLid ? null : number || null
  }

  return newMsg;
}

module.exports = {
    checkMsgToInsert,
    processAndTransformMessageWhatsapp
};
