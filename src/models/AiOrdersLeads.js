const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const AiOrdersLeadsSchema = new Schema({
    cliente_id: {type: Schema.ObjectId, ref: 'clientes'},
    createAt: Date,
    lastMessage: Date,
    status: String,
    orderDate: Date,
    chatId: {type: Schema.ObjectId, ref: 'chats'},
    resumeContext: String,
    crm_lead_id: {type: Schema.ObjectId, ref: 'crm_leads'}

});

module.exports =  mongoose.model('ai_orders_leads', AiOrdersLeadsSchema);
