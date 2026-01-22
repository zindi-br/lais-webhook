const { v3_actionAiPrediction } = require("../actions/ai.action");
const Config = require("../models/Config");


const variationMsgWithAi = async (msg) => {

    // buscando config global
    const globalConfig = await Config.findOne({name_config:"ai"});
    if(!globalConfig) {
        return msg;
    }
    const configPrompt = globalConfig?.config?.prompts?.msgVariation;
    
    if(configPrompt?.status === false) {
        console.log('configuração de variação de mensagem com IA desativada');
        return msg;
    }

    const response = await v3_actionAiPrediction(null, {
        "prompt":`${configPrompt?.prompt}\n\nMensagem original:\n\n${msg}\n\nRetorne apenas a mensagem reformulada`,
        "temperature":configPrompt?.temperature || 1,
        "purpose":"variationMsgWithAi",
        "description":"Automations - variationMsgWithAi",
        "model":configPrompt?.model
    })
    return response.data.data;
}

module.exports = {
    variationMsgWithAi
}