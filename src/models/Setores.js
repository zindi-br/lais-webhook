const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const SetoresSchema = new Schema({
    idCliente:String,
    nome_setor:String,
    data_criacao:Date,
    data_modificacao:Date,
    status:Boolean,
    statusTransferencia:Boolean,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'}

  
});

module.exports = User = mongoose.model('setores', SetoresSchema);
