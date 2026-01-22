const axios = require('axios');
const Config = require('../config/config');

const actionEnviarWebhookPersonalizado = (usuarioId, data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/socket/${usuarioId}/enviar-socket-device`,
        data
    });
}


module.exports = {
    actionEnviarWebhookPersonalizado
  };
