const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const GrossEventsWhatsappSchema = new Schema({
  object:Object,
  entry:Array,
  cliente_id: { type: Schema.ObjectId, ref: 'clientes' },
  date: Date
});

module.exports = User = mongoose.model('wb_gross_events', GrossEventsWhatsappSchema);
