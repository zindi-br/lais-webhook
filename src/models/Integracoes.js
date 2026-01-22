const mongoose = require('./mongoose');
const Schema = mongoose.Schema;
const Double = require('@mongoosejs/double');

const IntegracoesSchema = new Schema({
        tipo:String,
        data_criacao:Date,
        ultima_modificacao:Date,
        config:Object,
        status:Boolean,
        descontinuado:Boolean,
        cliente_id:{ type: Schema.ObjectId, ref: 'clientes' },

});

module.exports = mongoose.model('integracoes', IntegracoesSchema);
