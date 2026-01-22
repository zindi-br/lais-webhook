const axios = require('axios');
const Config = require('../config/config');

const actionStartChatbot = (chatbotId, data) => {
    console.log('chatbotId', chatbotId)
    console.log('data', data)
    return axios({
        method: "POST",
        url: `http://localhost:3062/flow/internal-prediction/${chatbotId}`,
        data
    });
}


module.exports = {
    actionStartChatbot
};
