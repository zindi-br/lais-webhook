const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const RespostasRapidasSchema = new Schema({
   titulo:String,
   resposta:String,
   cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
   data:Date,
   ativo:String,
   geral:Boolean

   
});

module.exports = User = mongoose.model('respostas', RespostasRapidasSchema);
