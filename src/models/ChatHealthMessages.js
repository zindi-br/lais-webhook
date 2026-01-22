const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ChatHealthMessagesSchema = new Schema({
    chat_id: { type: Schema.ObjectId, ref: 'chats' },
    session: String,
    phone: String,
    date: Date,
    cliente_id: { type: Schema.ObjectId, ref: 'clientes' },
    message_id: String,
    message_type: String,
    timestamp: { type: Number, default: () => Date.now() },
    last_client_message_date: Date,
    hours_since_last_client_message: Number,
    reason: String,
    sent_outside_24h_window: { type: Boolean, default: false },
    client_responded: { type: Boolean, default: false },
    client_response_date: Date,
    client_response_message_id: String,
    response_time_minutes: Number
});

module.exports = mongoose.model('chat_health_messages', ChatHealthMessagesSchema);
