const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const LogsSchema = new Schema({
    tipo:String,
    date:Date,
    scope:Object
});

module.exports = mongoose.model('logs', LogsSchema);
