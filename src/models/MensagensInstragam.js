const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const InstagramMensagensSchema = new Schema({
  cliente_id: { type: Schema.ObjectId, ref: 'clientes' },
  sender: Object,
  id: String,
  instagramUserId: String,
  timestamp: Number,
  date: Date,
  message: Object
});

module.exports = mongoose.model('instagram_mensagens', InstagramMensagensSchema);
