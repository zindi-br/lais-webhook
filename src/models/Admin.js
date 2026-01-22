const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    idCliente: String,
    id_cliente:{type: Schema.ObjectId, ref: 'clientes'},
    email: String,
    level:String,
    firstName:String,
    lastName:String,
    nomeFantasia:String,
    setor: String,
    password: String,
    senha:String,
    phone: String,
    username: String,
    lastOnline: {
        type: Date,
    },
    level: {
        type: String,
        default: 'standard',
    },
    ramal: String,
    status:Boolean,
    transferencia:Boolean,
    descontinuado:Boolean,
    marketplace_id:{type: Schema.ObjectId, ref: 'marketplace'},
    setor_id:{type: Schema.ObjectId, ref: 'setores'},
    historico:Array,
    provedor:String
});

module.exports = Admin = mongoose.model('administradores', UserSchema);
