const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const TicketsSchema = new Schema({
    ticket:Number,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    chat_id:{type: Schema.ObjectId, ref: 'chats'},
    usuario_id:{type: Schema.ObjectId, ref: 'usuarios'},
    avaliado:Boolean,
    data_aceito:Date,
    data_criado:Date,
    data_finalizado:Date,
    data_direcionado:Date,
    data_avaliando:Date,
    data_avaliado:Date,
    transferencias:Array,
    status:String,
    tempo_aceite:Number,
    tempo_conversa:Number,
    tempo_total_conversa:Number,
    tempo_criado_direcionado:Number    


});

module.exports = User = mongoose.model('tickets', TicketsSchema);
