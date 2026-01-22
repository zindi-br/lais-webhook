const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ClientesSchema = new Schema({
    nome:String,
    usuario:String,
    sessao:String,
    token:String,
    idCliente:String,
    status:Boolean,
    server_id:{type: Schema.ObjectId, ref: 'servers'},
    marketplace_id:{type: Schema.ObjectId, ref: 'marketplace'},
    plano_id:{type: Schema.ObjectId, ref: 'planos'},
    numero:String,
    conexao:Object,
    utils: Object,
    config:Object,
    pod:String,
    isReadyCheckMsgSend:Boolean,
    isReadyCheckActivity:Boolean,
    isMarketplace:Boolean,
    multiSession:Number,
    sentinela:Boolean,
    descontinuado:Boolean,
    isCampanha:Boolean,
    isHub:Boolean,
    cliente_pai_id:{type: Schema.ObjectId, ref: 'clientes'},
});

module.exports = User = mongoose.model('clientes', ClientesSchema);
