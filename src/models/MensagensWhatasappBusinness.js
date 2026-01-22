const mongoose = require('./mongoose');
const Schema = mongoose.Schema;


const MensagensWhatasappBusinnessSchema = new Schema({
    id: String,
    platform: String, // "whatsapp_business"
    chatId: String,
    to: String,
    from: String,
    type: String,
    timestamp: Number,
    body: String,
    isMe: Boolean,
    fromMe: Boolean, // Campo adicional para compatibilidade
    isMedia: Boolean,
    metadata: Object,
    media: Object,
    ack: Number,
    contact: Object,
    cliente_id: { type: Schema.ObjectId, ref: 'clientes' },
    
    // Campos específicos de mídia
    mimetype: String,
    filename: String,
    url: String,
    sha256: String,
    mediaId: String,
    voice: Boolean,
    from: String,
    to: String,
    sender: Object,
    // Campos de metadata do WhatsApp Business
    display_phone_number: String,
    phone_number_id: String,
    
    // Dados de anúncio/referral (WhatsApp Ads Click-to-WhatsApp)
    referral: {
      source_url: String,
      source_id: String,
      source_type: String,
      body: String,
      headline: String,
      media_type: String,
      image_url: String,
      ctwa_clid: String,
      welcome_message: Object
    },
    // Status de mensagens enviadas
    status: String,
    recipient_id: String,
    pricing: Object,
    context: Object
  });

module.exports = mongoose.model('wb_mensagens', MensagensWhatasappBusinnessSchema);
