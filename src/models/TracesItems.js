const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const TracesItemsSchema = new Schema({
    trace_id:{type: Schema.ObjectId, ref: 'traces'},
    campaign_id:{type: Schema.ObjectId, ref: 'campaigns'},
    chat_id:{type: Schema.ObjectId, ref: 'chats'},
    date: Date,
    number: String
  });

module.exports = mongoose.model('traces_items', TracesItemsSchema);
