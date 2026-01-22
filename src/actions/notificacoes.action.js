const axios = require('axios');
const Config = require('../config/config');

const actionEnviarOneSignal = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/notificacoes/aplicativo/enviar-onesignal`,
        data
    });
}

const actionEnviarMensagemCanalDiscord = (mensagem) => {
    return axios({
        method: "post",
        url: `https://api.lais.app/api/v1/admin/discord/enviar-mensagem-canal`,
        data: {mensagem: mensagem}
    });
}



module.exports = {
    actionEnviarOneSignal,
    actionEnviarMensagemCanalDiscord
  };
