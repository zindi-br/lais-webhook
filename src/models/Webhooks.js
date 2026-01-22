const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const WebhooksSchema = new Schema({
    cliente_id: {type: Schema.ObjectId, ref: 'clientes'},
    nome: String,
    url: String,
    method: String,
    events: Array,
    data_criacao: Date,

});

module.exports = Webhooks = mongoose.model('webhooks', WebhooksSchema);
