const mongoose = require('../mongoose');
const Schema = mongoose.Schema;

const AgentsTrainingSchema = new Schema({
    description: String,
    cliente_id: { type: Schema.ObjectId, ref: 'clientes' },    
    agent_id: { type: Schema.ObjectId, ref: 'ai_agentes' }, 
    content: Object,
    createAt: Date,
    lastModify: Date
});

module.exports = mongoose.model('ai_trainings', AgentsTrainingSchema);


