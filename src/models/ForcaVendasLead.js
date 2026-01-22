const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ForcaVendasLeadSchema = new Schema({
    data_criacao:Date,
    data_finalizacao:Date,
    usuario_id:{type: Schema.ObjectId, ref: 'usuarios'},
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    funil_id:{type: Schema.ObjectId, ref: 'funis'},
    action:String,
    dados_cliente: Object,
    converteu:Boolean
});

module.exports = User = mongoose.model('fv_leads', ForcaVendasLeadSchema);
