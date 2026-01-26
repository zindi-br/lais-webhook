const axios = require('axios');
const Config = require('../config/config');

const actionStartChatbot = (chatbotId, data) => {
    let request = {
        method: "POST",
        url: `${Config?.dev ? Config?.api_dev_chatbot : Config?.api_prod_chatbot}/flow/internal-prediction/${chatbotId}`,
        data
    }
    console.log('Iniciando chatbot flow:', JSON.stringify(request, null, 2));
    return axios(request);
}


module.exports = {
    actionStartChatbot
};
