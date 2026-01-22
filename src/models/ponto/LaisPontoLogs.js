const mongoose = require('../mongoose');
const Schema = mongoose.Schema;


const LaisPontoLogsSchema = new Schema({
  date: String,
  scope:Object,
  empresa_id:{type: Schema.ObjectId, ref: 'lais_rh_empresas'},
  colaborador_id:{type: Schema.ObjectId, ref: 'lais_rh_colaboradores'},
  type: String,
});

module.exports = mongoose.model('lais_rh_ponto_logs', LaisPontoLogsSchema);


