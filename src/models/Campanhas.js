const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const CampanhasSchema = new Schema({
    nome:String,
    interval:Number,
    status:Boolean,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    criado_por:{type: Schema.ObjectId, ref: 'usuarios'},
    funil_ids:[{type: Schema.ObjectId, ref: 'funis'}],
    funil_ids_content:Array,
    tag_ids:[{type: Schema.ObjectId, ref: 'tags'}],
    texto:String,
    tipo:String,
    file:Boolean,
    isEdit:Boolean,
    isChatAtendimento:Boolean,
    status_envio:String,
    files:Array,
    data_criacao:Date,
    data_envio:Date,
    data_inicio:Date,
    data_final:Date,
    isFiltroData:Boolean,
    descontinuado: {
        type: Boolean,
        default: false
    },

});

module.exports = User = mongoose.model('campanhas', CampanhasSchema);
