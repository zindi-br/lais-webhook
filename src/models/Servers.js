const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ServersSchema = new Schema({
    pod:String,
    ip:String,
    preco:String,
    setup:String,
    dia_vencimento:String
});

module.exports = User = mongoose.model('servers', ServersSchema);
