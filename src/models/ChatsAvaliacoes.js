const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ChatsAvaliacoesSchema = new Schema({
    date:Date,
    usuario_id:{type: Schema.ObjectId, ref: 'usuarios'},
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    chat_id:{type: Schema.ObjectId, ref: 'chats'},
    ticket_id:{type: Schema.ObjectId, ref: 'tickets'},
    nota:Number
});

module.exports = mongoose.model('chats_avaliacoes', ChatsAvaliacoesSchema);
