const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ForcaVendasAvaliacoesSchema = new Schema({
    date:Date,
    usuario_id:{type: Schema.ObjectId, ref: 'usuarios'},
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    lead_fv_id:{type: Schema.ObjectId, ref: 'fv_leads'},
    nota:Number
});

module.exports = User = mongoose.model('fv_avaliacoes', ForcaVendasAvaliacoesSchema);
