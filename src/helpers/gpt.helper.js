
const axios = require('axios');
const { actionDownloadMediaWhatsappUrl, actionDownloadMediaWhatsapp } = require("../actions/chat.action");
const { v2_actionGetMediaWhatsappBusiness } = require("../actions/meta.action");
const WhatsappMensagens = require("../models/WhatsappMensagens");
const { readAudio } = require("../services/openai.services");

/**
 * Converte uma URL de mídia em base64
 * @param {string} url - URL da mídia
 * @returns {Promise<string|null>} - Base64 da mídia ou null em caso de erro
 */
const convertUrlToBase64 = async (url) => {
  try {
    if (!url) {
      console.log('URL não fornecida para conversão em base64');
      return null;
    }

   
    // Baixar o arquivo da URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000 // 30 segundos de timeout
    });

    if (response.status !== 200) {
      console.log('Erro ao baixar mídia: status', response.status);
      return null;
    }

    // Converter para base64
    const base64 = Buffer.from(response.data).toString('base64');
    
    return base64;
    
  } catch (error) {
    console.error('Erro ao converter URL para base64:', error.message);
    return null;
  }
};

const refineAudioToText = async (chat, channel, aiAgent) => {
  const { id } = chat;


  if(chat?.transcribeAudio) {
    console.log('Transcrição de áudio já existe', chat?.transcribeAudio);
    return chat?.transcribeAudio;
  }

  if(channel?.platform === "whatsapp") {
    try {
      const query = `?sessao=${channel?.config?.sessao}&msgId=${id}&canal=whatsapp`;
      const response = await actionDownloadMediaWhatsapp(query);
      const { base64 } = response.data.data;
      const text = await readAudio(base64, channel, aiAgent);
      await WhatsappMensagens.updateOne({ id: id }, { transcribeAudio: text });
      return text;
    } catch (error) {
      console.log('Erro ao obter url audio', error);
      return null;
    }
  } else if (channel?.platform === "whatsapp_business") {
    try {
      // Obter o mediaId do chat
      const mediaId = chat.mediaId || chat.media?.id || chat[chat.type]?.id;
      
      if (!mediaId) {
        console.log('mediaId não encontrado no chat');
        return null;
      }

      const session = channel?.config?.sessao;
      const platform = channel?.platform;

      if (!session) {
        console.log('Sessão não encontrada no channel');
        return null;
      }

      // Obter a URL da mídia
      const response = await v2_actionGetMediaWhatsappBusiness(
        mediaId, 
        `?sessao=${session}&canal=${platform}&upload=1`
      );

      if (response.status !== 200) {
        return null;
      }

      const url = response?.data?.data?.url;

      if (!url) {
        console.log('URL não encontrada na resposta');
        return null;
      }

      // Converter URL para base64
      const base64 = await convertUrlToBase64(url);

      if (!base64) {
        console.log('Erro ao converter URL para base64');
        return null;
      }

      // Processar o áudio
      const text = await readAudio(base64, channel, aiAgent);
      await WhatsappMensagens.updateOne({ id: id }, { transcribeAudio: text, body: text });
      return text;


    } catch (error) {
      console.log('Erro ao processar áudio do WhatsApp Business', error);
      return null;
    }
  }
};

module.exports = {
  refineAudioToText,
  convertUrlToBase64
}