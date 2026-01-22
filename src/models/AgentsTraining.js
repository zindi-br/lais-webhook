const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const AgentsTrainingSchema = new Schema({
    description: String,
    title: String,
    content: String,
    cliente_id: { type: Schema.ObjectId, ref: 'clientes' },
    flowId: { type: Schema.ObjectId, ref: 'agentflows' },
    createAt: Date,
    lastModify: Date
});

module.exports = mongoose.model('agents_trainings', AgentsTrainingSchema);


