const axios = require('axios');
const Config = require('../config/config');

const actionDispararCustomWebhook = (url, data) => {
    return axios({
        method: "POST",
        url: url,
        data
    });
}


const actionResendWebhook = (data) => {
    console.log('resend webhook')
    return axios({
        method: "POST",
        url: `${Config?.api_dev_webhook}/webhook/v1/clientes/root`,
        data
    });
}


module.exports = {
    actionDispararCustomWebhook,
    actionResendWebhook
}