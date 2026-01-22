const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const UsageTokensSchema = new Schema({
    id_cliente:{type: Schema.ObjectId, ref: 'clientes'},
    client_id_hub:{type: Schema.ObjectId, ref: 'clients'},
    credential_id:{type: Schema.ObjectId, ref: 'credentials'},
    log_id:{type: Schema.ObjectId, ref: 'aipromptlogs'},
    date:Date,
    usage:Object,
    model:String
  });

module.exports = mongoose.model('usage_tokens', UsageTokensSchema);


