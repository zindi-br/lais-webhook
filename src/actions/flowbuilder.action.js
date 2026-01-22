const axios = require('axios');
const Config = require('../config/config');

const actionStartFlowBuilder = (flowId, data) => {
    return axios({
        method: "POST",
        url: `http://89.117.48.185:3001/api/v1/typebots/${flowId}/startChat`,
        headers: {
            Authorization: `Bearer GniB2DBcCsUlY71nL0PZpZqF`,
        },
        data
    });
}

const actionContinueFlowBuilder = (sessionFlowId, data) => {
    return axios({
        method: "POST",
        url: `http://89.117.48.185:3001/api/v1/sessions/${sessionFlowId}/continueChat`,
        data,
        headers: {
            Authorization: `Bearer GniB2DBcCsUlY71nL0PZpZqF`,
        },
    });
}


module.exports = {
    actionStartFlowBuilder,
    actionContinueFlowBuilder
  };
