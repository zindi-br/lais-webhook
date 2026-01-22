const { checkMediaMessage } = require('./whatsappBuninness.utils');
const { getTimestamp } = require('./time.utils');
const axios = require('axios');
const { v2_actionGetMediaWhatsappBusiness } = require('../actions/meta.action');

/**
 * Gera um thumbnail em base64 a partir de uma URL de imagem
 * @param {string} imageUrl - URL da imagem
 * @returns {Promise<string|null>} - Base64 da imagem ou null em caso de erro
 */
const generateImageThumbnail = async (imageUrl) => {
    try {
        console.log('Gerando thumbnail para:', imageUrl);
        
        // Baixar a imagem
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 10000 // 10 segundos de timeout
        });

        if(response.status !== 200){
            return "";
        }

        // Converter para base64
        const base64Image = Buffer.from(response.data).toString('base64');
        
        console.log('Thumbnail gerado com sucesso');
        return base64Image;
        
    } catch (error) {
        console.error('Erro ao gerar thumbnail:', error.message);
        return "";
    }
};

const transformMessageWbo = async (props) => {
    //console.log('transformMessageWbo props ', JSON.stringify(props, null, 2));
    const { messageItem, contact, clienteId, metadata, isMe, phoneNumberClientDisplay, session, platform } = props;

    if(!messageItem) {
        return null;
    }

    let mimetype = null;
    let filename = null;
    let url = null;
    let sha256 = null;
    let mediaId = messageItem[messageItem.type]?.id;
    let voice = null;
    let type = messageItem.type === "text" || messageItem.type === "button" ? "chat" : messageItem.type;
    let body = null;
    
    // Definir o body baseado no tipo de mensagem
    if (messageItem.type === "text") {
        body = messageItem.text?.body;
    } else if (messageItem.type === "button") {
        // Para mensagens do tipo button, usar o texto do botão como body
        body = messageItem.button?.text || messageItem.button?.payload;
    }
    let sender = {
        "id": contact?.wa_id || contact?.id,
        "name": contact?.profile?.name,
        "shortName": contact?.profile?.name,
        "type": "in",
        "verifiedName": contact?.profile?.name,
        "labels": [],
    }


    if(!isMe && messageItem.type !== "text" && messageItem.type !== "button") {
        const response_media = await v2_actionGetMediaWhatsappBusiness(mediaId, `?sessao=${session}&canal=${platform}&upload=1`);
        if(response_media.status === 200) {
            url = response_media?.data?.data?.url;
        }
    }

    // Processar diferentes tipos de mídia
    if (messageItem.type === "audio") {
        mimetype = messageItem.audio?.mime_type;
        sha256 = messageItem.audio?.sha256;
        mediaId = messageItem.audio?.id;
        voice = messageItem.audio?.voice;
    } else if (messageItem.type === "image") {
        mimetype = messageItem.image?.mime_type;
        sha256 = messageItem.image?.sha256;
        mediaId = messageItem.image?.id;
        console.log('body  2', body);
        body = await generateImageThumbnail(url);
        console.log('body  3', body);
    } else if (messageItem.type === "video") {
        mimetype = messageItem.video?.mime_type;
        url = messageItem.video?.url;
        sha256 = messageItem.video?.sha256;
        mediaId = messageItem.video?.id;
    } else if (messageItem.type === "document") {
        mimetype = messageItem.document?.mime_type;
        filename = messageItem.document?.filename;
        sha256 = messageItem.document?.sha256;
        mediaId = messageItem.document?.id;
    } else if (messageItem.type === "text") {
        type = "chat";
    }


    let data = {
        id: messageItem.id,
        platform: "whatsapp_business",
        chatId: messageItem.from + "@c.us",
        to: !isMe ? phoneNumberClientDisplay : messageItem.to,
        from: messageItem.from,
        type: type,
        timestamp: messageItem.timestamp,
        t: messageItem.timestamp,
        body: body,
        fromMe: isMe,
        isMedia: messageItem.type !== "text" && messageItem.type !== "button",
        media: (messageItem.type === "text" || messageItem.type === "button") ? null : checkMediaMessage(messageItem),
        // Campos específicos de mídia
        mimetype: mimetype,
        filename: filename,
        url: url,
        sha256: sha256,
        mediaId: mediaId,
        voice: voice,
        sender: sender,
        // Campos de metadata
        display_phone_number: metadata?.display_phone_number,
        phone_number_id: metadata?.phone_number_id,
        cliente_id: clienteId,
        contact: {
            phone: contact?.wa_id || contact?.id,
            name: contact?.profile?.name,
            wa_id: contact?.wa_id
        },
        context: messageItem?.context,
        // Informações específicas do botão (se aplicável)
        button: messageItem.type === "button" ? {
            payload: messageItem.button?.payload,
            text: messageItem.button?.text
        } : undefined,
        referral: messageItem?.referral ? {
            source_url: messageItem.referral.source_url,
            source_id: messageItem.referral.source_id,
            source_type: messageItem.referral.source_type,
            body: messageItem.referral.body,
            headline: messageItem.referral.headline,
            media_type: messageItem.referral.media_type,
            image_url: messageItem.referral.image_url,
            ctwa_clid: messageItem.referral.ctwa_clid,
            welcome_message: messageItem.referral.welcome_message
        } : undefined
    }

    return data;
}


module.exports = {
    transformMessageWbo
}