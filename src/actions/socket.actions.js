const axios = require('axios');
const Config = require('../config/config');

const actionEnviarSocketUsuario = (usuarioId, data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v1/socket/${usuarioId}/enviar-socket-device`,
        data
    });
}

const actionEnviarSocketUsuarioFront = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev_ws : Config.api_prod_ws}/api/socket/enviar`,
        data
    });
}


module.exports = {
    actionEnviarSocketUsuario,
    actionEnviarSocketUsuarioFront
  };
