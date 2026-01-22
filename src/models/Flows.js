const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const FlowsSchema = new Schema({
    config:Object,
    descontinued:Boolean,
    description:String,
    name:String,
    status:Boolean,
    createAt:Date,
    lastModify:Date,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
});

module.exports = mongoose.model('agentflows', FlowsSchema);
