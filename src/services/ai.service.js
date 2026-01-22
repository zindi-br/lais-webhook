const AiAgents = require("../models/AiAgents");
const AiOrdersLeads = require("../models/AiOrdersLeads");
const Chats = require("../models/Chats");
const mongoose = require("mongoose");
const CrmLeads = require("../models/CrmLeads");
const { actionCriarCrmLead } = require("../actions/crm.action");
const Contatos = require("../models/Contatos");

const verifyLeadAndSaveCrmLead = async (props) => {
   const {chatId, aiOrderLeadId, channel} = props;

   // buscando aiagent
   const aiAgent = await AiAgents.findOne({_id: channel?.config?.laisai_v2?.ai_agent_id}).select('name config cliente_id');
   const aiAgentModules = aiAgent?.config?.generalConfig?.modules;
   const aiOrderLead = await AiOrdersLeads.findOne({_id: aiOrderLeadId});

   const chat = await Chats.findOne({_id: aiOrderLead?.chatId})
   const contato = await Contatos.findOne({_id: chat?.contato_id});

   let name = chat?.nomeCliente;
   if(contato?.nome) {
      name = contato?.nome;
   }

   if(aiAgentModules?.realestate?.status) {
      if(aiAgentModules?.realestate?.onlyLead) {

         if(aiOrderLead?.crm_lead_id) {
            return;
         };

         const leads = await CrmLeads
         .findOne({
            whatsapp_chat_id: aiOrderLead?.chatId,
            closed: false,
            realestate:{
               $exists: true
            }
         })
         .sort({data_modificacao: -1});

         console.log('leads', leads);

         if(!leads) {
            // criando crm lead e atualizando aiOrderLead
            let dataCrmLead = {
               "clienteId": aiAgent.cliente_id,
               "usuarioId": null,
               "scope": {
                   "nome": name,
                   "qualificacao": 1,
                   "create_ai": true,
                   "pipelineId": aiAgentModules?.realestate?.crmPipelineId,
                   "pipelineEstagioId": aiAgentModules?.realestate?.crmStageId,
                   "origemId": aiAgentModules?.realestate?.crmOriginId,
                   "contatoId": null,
                   "valor": null,
                   "whatsapp_chat_id": aiOrderLead?.chatId,
                   "realestate": {
                     "distric_interest": [],
                     "min_price": 0,
                     "max_price": 0,
                     "properties_sent": [],
                     "address": [],
                     "city_interest": null,
                     "destination": null
                   }
               }
           }
            const crmLead = await actionCriarCrmLead(dataCrmLead);
            if(crmLead.status === 200) {
               await AiOrdersLeads.updateOne({_id: aiOrderLeadId}, {$set: {crm_lead_id: crmLead.data?.data?._id}});
            }
            return;
         } else {
            await AiOrdersLeads.updateOne({_id: aiOrderLeadId}, {$set: {crm_lead_id: leads?._id}});
            return;
         }
      }
   }

}


module.exports = {
    verifyLeadAndSaveCrmLead
}
