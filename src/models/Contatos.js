const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ContatosSchema = new Schema({
        nome: String,
        telefone: String,
        info:Object,
        cliente_id: {type: Schema.ObjectId, ref: 'clientes'},
        data_criacao: Date,
        data_modificacao: Date,
        criado_por:{type: Schema.ObjectId, ref: 'usuarios'},
        descontinuado: Boolean,
        contatos:[{type: Schema.ObjectId, ref: 'contatos'}],
        custom_fields:Array
    
});

module.exports = mongoose.model('contatos', ContatosSchema);
