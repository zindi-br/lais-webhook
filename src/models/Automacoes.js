const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const AutomacoesSchema = new Schema({
    name: String,
    description: String,
    status: Boolean,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    params: Object,
    create_at: Date,
    last_update: Date,
    cliente_id:{type: Schema.ObjectId, ref: 'usuarios'},
    deleted: Boolean,
    draft: Boolean,
    history: Array
    
});

module.exports = mongoose.model('lais_automacoes', AutomacoesSchema);

