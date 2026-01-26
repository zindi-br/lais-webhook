const axios = require('axios');
const Config = require('../config/config');

const actionStartChatbot = (chatbotId, data) => {
    return axios({
        method: "POST",
        url: `${Config?.dev ? Config?.api_dev_chatbot : Config?.api_prod_chatbot}/flow/internal-prediction/${chatbotId}`,
        data
    });
}


module.exports = {
    actionStartChatbot
};
