const axios = require('axios');

const actionSendEventDev = (url, data) => {
    return axios({
        method: "POST",
        url: url,
        data
    });
}


module.exports = {
    actionSendEventDev
  };
