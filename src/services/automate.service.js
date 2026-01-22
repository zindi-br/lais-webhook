const { actionExecuteAutomate } = require("../actions/automacao.action");
const mongoose = require('mongoose');

const executeAutomate = async (clienteId, actions, scope) => {
    try {
      actions.forEach(async (action) => {
        let data = {
          "action": action,
          "scope": scope
        }
        try {
          actionExecuteAutomate(clienteId, data)
        } catch (err) {
          console.log("Erro ao enviar para automação",err)
        }
  
      });
    } catch (err) {
      console.log(err)
    }
}

const findAutomateFromChatContains = async (clienteId) => {
    const response = await Automacoes.findOne({
        "params.from.action":"from.chat.contains",
        cliente_id: mongoose.Types.ObjectId(clienteId),
        deleted:false,
        status:true
    })
}

  module.exports = {
    executeAutomate,
    findAutomateFromChatContains
}