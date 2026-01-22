const mongoose = require('../mongoose');
const Schema = mongoose.Schema;


const LaisPontoColaboradoresSchema = new Schema({
  nome: String,
  cpf: String,
  empresa_id:{type: Schema.ObjectId, ref: 'lais_rh_empresas'},
  whatsapp: String,
  config: Object
});

module.exports = mongoose.model('lais_rh_colaboradores', LaisPontoColaboradoresSchema);


