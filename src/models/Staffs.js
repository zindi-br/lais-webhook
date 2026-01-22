const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const StaffSchema = new Schema({
    people: [{type: Schema.ObjectId, ref: 'usuarios'}],
    cliente_id: {type: Schema.ObjectId, ref: 'clientes'},
    title: String,
    picture: {type: Schema.ObjectId, ref: 'images'},
    isGroup: {type: Boolean, default: false},
    lastUpdate: Date,
    lastAuthor: {type: Schema.ObjectId, ref: 'usuarios'},
    lastMessage: {type: Schema.ObjectId, ref: 'messages'},
});

module.exports = User = mongoose.model('staffs', StaffSchema);
