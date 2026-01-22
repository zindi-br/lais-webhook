const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ForcaVendasMensagensDefinidasSchema = new Schema({
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    titulo:String,
    mensagem: String,
    status:Boolean,
    days_send: Number,
    programada:Boolean
});

module.exports = User = mongoose.model('fv_mensagens', ForcaVendasMensagensDefinidasSchema);
