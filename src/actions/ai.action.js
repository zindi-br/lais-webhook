const axios = require('axios');
const Config = require('../config/config');

const actionPredictionSimpleAi = (sessao, data, agentId) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v2/ai/simple/prediction?sessao=${sessao}&agent=Id=${agentId}`,
        data
    });
}

const actionAgentsPrediction = (sessao, data, agentId) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v2/ai/agentes/prediction?sessao=${sessao}&agent_id=${agentId}`,
        data
    });
}

const v3_actionAgentsPrediction = (sessao, data, agentId) => {

    let dataToSend = {
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v3/ai/agentes/prediction?sessao=${sessao}&agent_id=${agentId}`,
        data
    }
    return axios(dataToSend);
}

const v3_actionAgentsFlow = (sessao, data, agentId) => {

    let dataToSend = {
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v3/ai/agentes/flow?sessao=${sessao}&agent_id=${agentId}`,
        data
    }
    return axios(dataToSend);
}

const v2_actionTextToSpeech = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v2/ai/vozes/text-to-speech`,
        data
    });
}

const v2_actionAnalyzeImage = (data) => {
    return axios({
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v2/ai/analyze-image`,
        data
    });
}


const v2_actionAnaliseAtendimento = (data) => {
    return axios({
        method: "post",
        url: `https://api-analysis.lais.app/api/v2/AI/gemini/analyze`,
        data
        });
};


const v3_actionAiPrediction = (clienteId, data) => {

    let dataToSend = {
        method: "POST",
        url: `${Config.dev ? Config.api_dev : Config.api_prod}/api/v3/${clienteId}/ai/prediction`,
        data
    }
    return axios(dataToSend);
}



module.exports = {
    actionPredictionSimpleAi,
    actionAgentsPrediction,
    v2_actionTextToSpeech,
    v2_actionAnalyzeImage,
    v3_actionAgentsPrediction,
    v2_actionAnaliseAtendimento,
    v3_actionAgentsFlow,
    v3_actionAiPrediction
}