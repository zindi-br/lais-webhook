const mongoose = require('../mongoose');
const Schema = mongoose.Schema;


const LaisPontoEmpresasSchema = new Schema({
    nome: String,
    cnpj: String,
    ie: String,
    razao_social: String,
    endereco: Object,
    config: Object
  });

module.exports = mongoose.model('lais_rh_empresas', LaisPontoEmpresasSchema);


