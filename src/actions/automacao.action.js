const axios = require('axios');
const Config = require('../config/config');

const actionExecuteAutomate = (clienteId, data) => {
    let dataPost = {
        method: "post",
        url:`${Config.dev ? Config.api_dev_automacao : Config.api_prod_automacao}/api/${clienteId}/execute`,
        data
    }
    return axios(dataPost);
}


module.exports = {
    actionExecuteAutomate
  };
