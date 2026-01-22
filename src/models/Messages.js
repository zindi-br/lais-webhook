const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    author: {type: Schema.ObjectId, ref: 'usuarios'},
    cliente_id: {type: Schema.ObjectId, ref: 'clientes'},
    content: String,
    type: String,
    file: {type: Schema.ObjectId, ref: 'files'},
    room: {type: Schema.ObjectId, ref: 'staffs'},
    date: {
        type: Date,
        default: Date.now
    },
});

module.exports = User = mongoose.model('messages', MessageSchema);
