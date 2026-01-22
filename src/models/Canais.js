const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const CanaisSchema = new Schema({
    nome: String,
    status: Boolean,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    oficial: Boolean,
    platform: String,
    config: Object,
    date: Date,
    principal: Boolean,
    sessao: String,
    pod:String,
    token:String,
    descontinuado:{type: Boolean, default: false},
    webhook_type:String,
    status_connection_whatsapp:String

});

module.exports = Canais = mongoose.model('canais', CanaisSchema);
