const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const OtpVerificacoesSchema = new Schema({
        codigo: String,
        email:String,
        cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
        usuario_id:{type: Schema.ObjectId, ref: 'usuarios'},
        date:Date,
        tipo: String

});


module.exports = User = mongoose.model('otp_verificacoes', OtpVerificacoesSchema);
