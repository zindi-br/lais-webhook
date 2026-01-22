const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const FunisSchema = new Schema({
    nome_funil:String,
    data_criacao:Date,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    ativo:Boolean,
    

  
});

module.exports = Funis = mongoose.model('funis', FunisSchema);
