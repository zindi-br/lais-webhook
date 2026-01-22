const mongoose = require('../mongoose');
const Schema = mongoose.Schema;


const LaisPontoRegistrosHistorySchema = new Schema([{
    date:Date,
    action:String,
    content:Object
}]);

const LaisPontoRegistrosSchema = new Schema({
    stage: String,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    date: Date,
    chatNumberId: String,
    history: LaisPontoRegistrosHistorySchema,
    last_modify: Date
  });

module.exports = mongoose.model('lais_rh_ponto_sessoes', LaisPontoRegistrosSchema);


