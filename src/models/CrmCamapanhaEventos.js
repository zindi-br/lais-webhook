const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const CrmCampanhasEventosSchema = new Schema({
    campaign_id: {
        type: Schema.ObjectId, 
        ref: 'crm_campaigns'
    },
    chat_id: {
        type: Schema.ObjectId, 
        ref: 'chats'
    },
    cliente_id: {
        type: Schema.ObjectId, 
        ref: 'clientes'
    },
    phone: {
        type: String
    },
    type: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Middleware para atualizar o campo update_at antes de salvar
CrmCampanhasEventosSchema.pre('save', function(next) {
    this.update_at = new Date();
    next();
});

module.exports = mongoose.model('crm_campaigns_events', CrmCampanhasEventosSchema);
