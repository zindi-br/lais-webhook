const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const PricingEventsWhatsappSchema = new Schema({
  cliente_id: { type: Schema.ObjectId, ref: 'clientes' },
  canal_id: { type: Schema.ObjectId, ref: 'canais' },
  message_id: String,
  date: Date,
  session: String,
  status_message: String,
  price_category: String,
  price_type: String,
  price_precing_model: String,
  timestamp: Number

});

module.exports = User = mongoose.model('wb_pricing_events', PricingEventsWhatsappSchema);
