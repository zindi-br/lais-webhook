const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const LogCampanhasSchema = new Schema({
    numeroCliente:String,
    campanha_id:{type: Schema.ObjectId, ref: 'campanhas'},
    status_envio:String,
    data:Date


});

module.exports = User = mongoose.model('log_campanhas', LogCampanhasSchema);
