const mongoose = require('../mongoose');
const Schema = mongoose.Schema;


const LaisPontoRegistrosHistorySchema = new Schema([{
    date:Date,
    action:String,
    content:Object
}]);

const LaisPontoRegistrosSchema = new Schema({
    colaborador_id:{type: Schema.ObjectId, ref: 'clientes'},
    status: String,
    deleted: Boolean,
    date: Date,
    last_modify: Date,
    history:Array,
   // history: LaisPontoRegistrosHistorySchema,
    legacy: Object,
    type: String,
    type_create: String,
    loc: Object
  });

module.exports = mongoose.model('lais_rh_ponto_registros', LaisPontoRegistrosSchema);



