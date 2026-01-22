const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const MensagensAgendadasSchema = new Schema({
    nome:String,
    interval:Number,
    status:Boolean,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    criado_por:{type: Schema.ObjectId, ref: 'usuarios'},
    texto:String,
    file:Boolean,
    isEdit:Boolean,
    status_envio:String,
    numero:String,
    files:Array,
    data_criacao:Date,
    data_envio:Date,
    descontinuado: {
        type: Boolean,
        default: false
    },

});

module.exports = User = mongoose.model('mensagens_agendadas', MensagensAgendadasSchema);
