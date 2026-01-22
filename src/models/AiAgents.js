const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const AiAgentsSchema = new Schema({
    config:Object,
    trash:Boolean,
    description:String,
    name:String,
    status:Boolean,
    createAt:Date,
    lastModify:Date,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
});

module.exports = mongoose.model('ai_agentes', AiAgentsSchema);
