const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const CrmCampanhasSchema = new Schema({
    name: {
        type: String
    },
    cliente_id: {
        type: Schema.ObjectId, 
        ref: 'clientes'
    },
    created_by: {
        type: Schema.ObjectId,
        ref: 'usuarios'
    },
    create_at: {
        type: Date,
        default: Date.now
    },
    update_at: {
        type: Date,
        default: Date.now
    },
    start_date: {
        type: Date
    },
    end_date: {
        type: Date
    },
    deleted: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'cancelled'],
        default: 'active'
    },
    config: {
        budget: {
            type: String,
            default: ""
        },
        type: {
            type: String,
            default: ""
        },
        spent: {
            type: String,
            default: ""
        },
        impressions: {
            type: String,
            default: ""
        },
        clicks: {
            type: String,
            default: ""
        },
        cpc: {
            type: String,
            default: ""
        },
        keys: {
            type: Array,
            default: []
        }
    },
    platform: {
        type: String
    }
});

// Middleware para atualizar o campo update_at antes de salvar
CrmCampanhasSchema.pre('save', function(next) {
    this.update_at = new Date();
    next();
});

module.exports = mongoose.model('crm_campaigns', CrmCampanhasSchema);
