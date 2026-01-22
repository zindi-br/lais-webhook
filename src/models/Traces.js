const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const TracesSchema = new Schema({
    content: String,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    status: Boolean,
    deleted: Boolean,
    createAt: Date,
    name: String,
    campaign_id:{type: Schema.ObjectId, ref: 'campaigns'}
  });

module.exports = mongoose.model('traces', TracesSchema);
