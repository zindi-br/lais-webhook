const axios = require('axios');
const Config = require('../config/config');

const actionCriarCrmLead = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v2/crm/leads/criar`,
        data
    });
}

module.exports = {
    actionCriarCrmLead
}