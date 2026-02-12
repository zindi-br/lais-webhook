const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const TemplatesWhatsappCategoryLogsSchema = new Schema({
  templateId: {
    type: Schema.ObjectId,
    ref: 'wb_templates',
    required: true
  },
  metaTemplateId: String,
  templateName: String,
  categoryAnterior: {
    type: String,
    enum: ['AUTHENTICATION', 'MARKETING', 'UTILITY']
  },
  categoryNova: {
    type: String,
    enum: ['AUTHENTICATION', 'MARKETING', 'UTILITY']
  },
  canalId: {
    type: Schema.ObjectId,
    ref: 'canais'
  },
  cliente_id: {
    type: Schema.ObjectId,
    ref: 'clientes'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

TemplatesWhatsappCategoryLogsSchema.index({ templateId: 1 });
TemplatesWhatsappCategoryLogsSchema.index({ canalId: 1 });
TemplatesWhatsappCategoryLogsSchema.index({ cliente_id: 1 });
TemplatesWhatsappCategoryLogsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('wb_templates_category_logs', TemplatesWhatsappCategoryLogsSchema);
