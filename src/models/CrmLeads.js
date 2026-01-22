const Double = require('@mongoosejs/double/lib');
const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const CrmLeadsSchema = new Schema({
        cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
        criado_por:{type: Schema.ObjectId, ref: 'usuarios'},
        crm_pipeline_id:{type: Schema.ObjectId, ref: 'crm_pipelines'},
        motivo_perda: {type: Schema.ObjectId, ref: 'crm_motivo_perdas'},
        estagio_pipeline_id:{type: Schema.ObjectId, ref: 'crm_pipelines_stages'},
        origem_lead_id:{type: Schema.ObjectId, ref: 'crm_sources'},
        whatsapp_chat_id:{type: Schema.ObjectId, ref: 'chats'},
        contato_id:{type: Schema.ObjectId, ref: 'contatos'},
        empresa_id:{type: Schema.ObjectId, ref: 'empresas'},
        usuario_id:{type: Schema.ObjectId, ref: 'usuarios'},
        data_criacao:Date ,
        data_finalizacao:Date ,
        data_modificacao:Date,
        data_previsao:Date ,
        data_conversao:Date ,
        em_espera:Boolean,
        nome: String,
        qualificacao: Number,
        historico: Array,
        arquivos:Array,
        notas:Array,
        convertido:Number,
        closed:Boolean,
        valor:Double,
        campaign_id: {type: Schema.ObjectId, ref: 'crm_campaigns'},
        realestate: Object,
        lead_type: String
});

module.exports = mongoose.model('crm_leads', CrmLeadsSchema);
