const axios = require('axios');
const Config = require('../config/config');

const actionNovaMensagem = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/chat/nova-mensagem`,
        data
    });
}


const actionAlterarFotoPerfil = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/chat/alterar-foto`,
        data
    });
}


const actionDownloadMediaWhatsapp = (queryPath) => {
    return axios({
        method: "GET",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/canais/download-media${queryPath}`,
        maxContentLength: 100 * 1024 * 1024,
        maxBodyLength: 100 * 1024 * 1024,
    });
};

const actionDownloadMediaWhatsappUrl = (queryPath) => {
    return axios({
        method: "GET",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/canais/download-media-url${queryPath}`,
        maxContentLength: 100 * 1024 * 1024,
        maxBodyLength: 100 * 1024 * 1024,
    });
};

const actionEnviarMensagemWhatsapp = (querys, data) => {
    return axios({
         method: "post",
         url:`${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/canais/enviar-mensagem${querys}`,
         data
     });
 };

 
const actionEnviarArquivoBase64Whatsapp = (querys, data) => {
    return axios({
         method: "post",
         url:`${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/canais/enviar-arquivo-base64${querys}`,
         data
     });
 };

 const v1_actionEnviarVozWhatsapp = (querys, data) => {
    return axios({
        method: "post",
        url:`${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/canais/enviar-voz${querys}`,
        data,
        maxContentLength: Infinity,
        maxBodyLength: Infinity

    });
};

 const actionLogoutSession = (querys, data) => {
    return axios({
         method: "post",
         url:`${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/canais/logout-session${querys}`,
         data
     });
 };



const actionUploadS3 = (data, queryPath) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v2/s3/upload${queryPath}`,
        maxContentLength: 100 * 1024 * 1024,
        maxBodyLength: 100 * 1024 * 1024,
        headers: {
            'Content-Type': `multipart/form-data; boundary=${data._boundary}`
        },
        data
    });
};


const actionCriarChat = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/chat/criar`,
        data
    });
}

const actionAvaliarChat = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/chat/avaliar`,
        data
    });
};

const actionEnviarDigitando = (querys, data) => {
    return axios({
         method: "post",
         url:`${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/canais/digitando${querys}`,
         data
     });
 };

 const actionStatusChatbot = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/chat/status-chatbot`,
        data
    });
}

const v1_actionEnviarArquivoBuffer = (querys, formData) => {
    return axios({
        method: "post",
        url:`${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/chats/canais/enviar-arquivo-buffer${querys}`,
        data: formData,
        headers: formData.getHeaders()
    });
};


module.exports = {
    actionNovaMensagem,
    actionAlterarFotoPerfil,
    actionDownloadMediaWhatsapp,
    actionUploadS3,
    actionCriarChat,
    actionEnviarMensagemWhatsapp,
    actionAvaliarChat,
    actionLogoutSession,
    actionEnviarArquivoBase64Whatsapp,
    actionDownloadMediaWhatsappUrl,
    actionEnviarDigitando,
    actionStatusChatbot,
    v1_actionEnviarVozWhatsapp,
    v1_actionEnviarArquivoBuffer
  };
