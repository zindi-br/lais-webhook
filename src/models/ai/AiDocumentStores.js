const mongoose = require('../mongoose');
const Schema = mongoose.Schema;

const AgentsDocumentsStoresSchema = new Schema({
    description: String,
    name: String,
    cliente_id: { type: Schema.ObjectId, ref: 'clientes' },
    document_store_id: String,
    createAt: Date,
    lastModify: Date
});

module.exports = mongoose.model('ai_document_stores', AgentsDocumentsStoresSchema);


