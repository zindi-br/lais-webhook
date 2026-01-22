const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const FluxosSchema = new Schema({
    recebe:String,
    direciona_usuarios: [{type: Schema.ObjectId, ref: 'usuarios'}],
    direciona_setores: [{type: Schema.ObjectId, ref: 'setores'}],
    nome_setor:String,
    data_criacao:Date,
    data_modificacao:Date,
    status:Boolean,
    idCliente:String,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    

  
});

module.exports = User = mongoose.model('fluxos', FluxosSchema);
