const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PedidoSchema = new Schema({
    id: { type: String, required: true },
    multicd_id: { type: String, default: '0' },
    identificacao: { type: String, required: true },
    data: { type: Date, required: true },
    prazo_producao: { type: String, default: '0' },
    status: { type: Object, default: {} },
    status_data: { type: Date, required: true },
    imposto_valor: { type: String, default: '0' },
    observacoes: { type: String, default: '' },
    observacoes_internas: { type: String, default: '' },
    mensagem_presente: { type: String, default: '' },
    hub: { type: String, default: '0' },
    hub_id: { type: String, default: '' },
    querystring: { type: String, default: '' },
    vendedor: { type: String, default: '' },
    fidelizado: { type: String, default: '0' },
    nota_fiscal: { type: Array, default: [] },
    adicional: { type: Array, default: [] },
    ip: { type: String, default: '' },
    user_agent: { type: String, default: '' },
    loja_compra_id: { type: String, required: true },
    loja: { type: Object, default: {} },
    owner: { type: Object, default: {} },
    sem_senha: { type: String, default: '0' },
    is_mobile: { type: String, default: '0' },
    is_delivery: { type: String, default: '0' },
    has_split: { type: String, default: '0' },
    pedido_pai_id: { type: String, default: '0' },
    editado: { type: String, default: '0' },
    editado_por: { type: String, default: '' },
    impresso: { type: String, default: '0' },
    primeira_compra: { type: String, default: '0' },
    optin: { type: String, default: '0' },
    total_lojas: { type: String, default: '1' },
    has_signature: { type: String, default: '' },
    assinaturas_id: { type: String, default: '' },
    total_itens: { type: String, required: true },
    pagamento: { type: Object, default: {} },
    antifraude: { type: Array, default: [] },
    frete: { type: Object, default: {} },
    cupom: { type: Object, default: {} },
    cliente: { type: Object, default: {} },
    produtos: { type: Array, default: [] },
    valor_total: { type: Object, default: {} },
    historico: { type: Array, default: [] },
    historico_desconto: { type: Array, default: [] },
    faturado: { type: String, default: '' },
    isPay: { type: String, default: '' },
    channel: { 
        id: { type: String, required: true },
        name: { type: String, required: true },
        detail: { 
            cnpj: { type: String, default: '' }
        }
    },
    total_cds: { type: String, default: '1' }
}, { timestamps: true });

module.exports = mongoose.model('pedidos', PedidoSchema);
