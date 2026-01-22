const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const TemplatesWhatsappSchema = new Schema({
  // Informações básicas do template
  name: {
    type: String,
    required: true
  },
  templateName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['AUTHENTICATION', 'MARKETING', 'UTILITY']
  },
  language: {
    type: String,
    required: true,
    default: 'pt_BR'
  },
  
  // Conteúdo do template
  components: Array,
  
  // Status do template
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISABLED', 'PAUSED'],
    default: 'PENDING'
  },
  
  // IDs do Meta/WhatsApp
  templateId: String, // ID retornado pela API do Meta
  wabaId: String, // WhatsApp Business Account ID
  
  // Informações de aprovação
  rejectionReason: String,
  approvedAt: Date,
  rejectedAt: Date,
  
  // Metadados
  createdBy: {
    type: Schema.ObjectId,
    ref: 'usuarios',
    required: true
  },
  updatedBy: {
    type: Schema.ObjectId,
    ref: 'usuarios'
  },
  
  // Configurações do canal
  cliente_id: {
    type: Schema.ObjectId,
    ref: 'clientes',
    required: true
  },
  canalId: {
    type: Schema.ObjectId,
    ref: 'canais'
  },
  
  // Tags para organização
  tags: [String],
  
  // Descrição do template
  description: String,
  
  // Data de criação e atualização
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para melhor performance
TemplatesWhatsappSchema.index({ name: 1 });
TemplatesWhatsappSchema.index({ status: 1 });
TemplatesWhatsappSchema.index({ canalId: 1 });
TemplatesWhatsappSchema.index({ createdBy: 1 });
TemplatesWhatsappSchema.index({ category: 1 });

// Middleware para atualizar updatedAt
TemplatesWhatsappSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Método para verificar se o template está aprovado
TemplatesWhatsappSchema.methods.isApproved = function() {
  return this.status === 'APPROVED';
};

// Método para verificar se o template está pendente
TemplatesWhatsappSchema.methods.isPending = function() {
  return this.status === 'PENDING';
};

// Método para aprovar template
TemplatesWhatsappSchema.methods.approve = function(userId) {
  this.status = 'APPROVED';
  this.approvedAt = new Date();
  this.updatedBy = userId;
  this.rejectionReason = undefined;
};

// Método para rejeitar template
TemplatesWhatsappSchema.methods.reject = function(userId, reason) {
  this.status = 'REJECTED';
  this.rejectedAt = new Date();
  this.updatedBy = userId;
  this.rejectionReason = reason;
};

module.exports = mongoose.model('wb_templates', TemplatesWhatsappSchema);
