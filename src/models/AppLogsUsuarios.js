const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const AppLogsUsuariosSchema = new Schema({
    tipo:String,
    log:String,
    device:String,
    usuario_id:{type: Schema.ObjectId, ref: 'usuarios'},
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    date:Date


});

module.exports = User = mongoose.model('app_logs_usuarios', AppLogsUsuariosSchema);
