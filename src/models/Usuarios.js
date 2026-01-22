const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    idCliente: String,
    id_cliente:{type: Schema.ObjectId, ref: 'clientes'},
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    email: String,
    level:String,
    firstName:String,
    lastName:String,
    nomeFantasia:String,
    setor: String,
    password: String,
    senha: String,
    phone: String,
    telefone: String,
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
    isDisabledStaff:Boolean,
    isDisabledWhatsapp:Boolean,
    isCampanha:Boolean,
    isDeleteMessage: {
        type: Boolean,
        default: true,
    },
    isSendFileStaff: {
        type: Boolean,
        default: false,
    },
    marketplace_id:{type: Schema.ObjectId, ref: 'marketplace'},
    setor_id:{type: Schema.ObjectId, ref: 'setores'},
    historico:Array,
    isOnlineUsersStaff: {
        type: Boolean,
        default:true,
    },
    rules:Array,
    onesignal_player_id:String,
    cliente_id_padrao:{type: Schema.ObjectId, ref: 'clientes'},
    expo_push_token:String,
    userStandby: Boolean,
    config:Object
    

});

module.exports = mongoose.model('usuarios', UserSchema);
