const UsageTokens = require('../models/UsageTokens');
const LogsPromptsAi = require('../models/LogsPromptsAi');
const Logs = require('../models/Logs');

const addUsageTokens = async (clienteId, credentialId, logId, response, model) => {

    function formatOpenAiToAdd(response) {
        let newObj = {
            input: response?.usage?.prompt_tokens,
            output: response?.usage?.completion_tokens,
            total: response?.usage?.total_tokens
        }
        return newObj;
    }

    let data = {
        cliente_id: clienteId,
        credential_id: credentialId,
        log_id: logId,
        model: model,
        date: new Date(),
        usage: formatOpenAiToAdd(response)
    }
    await UsageTokens(data).save();
}

const addLogPrompts = async (scope, response, model, credentialId, logId) => {

    let dataLog = {
        date: new Date(),
        log: {
            scope: scope,
            source: {
                clientId: scope?.messageConfig?.clienteId,
                number: scope?.messageConfig?.number,
            },
            provider: 'openai',
            response: response
        }
    }
    await LogsPromptsAi(dataLog).save();
}

const addLogs = async (type, scope) => {
    let dataLog = {
        date: new Date(),
        tipo: type,
        scope: scope
    }
    await Logs(dataLog).save();
}



module.exports = {
    addUsageTokens,
    addLogPrompts,
    addLogs
}



