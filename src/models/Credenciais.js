const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const CredentialsSchema = new Schema({
    createBy:{type: Schema.ObjectId, ref: 'usuarios'},
    clientId:{type: Schema.ObjectId, ref: 'clientes'},
    providerId:{type: Schema.ObjectId, ref: 'integrationsProviders'},
    keys: Object,
    updateAt: Date,
    createAt: Date,
    delete: Boolean,
    status: Boolean,
  });

module.exports = mongoose.model('credenciais', CredentialsSchema);
