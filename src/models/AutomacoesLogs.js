const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AutomacoesLogsSchema = new Schema({
        create_at: Date,
        scope: Object,
        cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
        automacao_id: {type: Schema.ObjectId, ref: 'lais_automacoes'},
});


module.exports = mongoose.model('lais_automacoes_atividades', AutomacoesLogsSchema);

