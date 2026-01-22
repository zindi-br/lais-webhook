const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ConfigSchema = new Schema({
    config:Object,
    name_config:String
});

module.exports = mongoose.model('configs', ConfigSchema);
