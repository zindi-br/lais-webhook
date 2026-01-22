const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const AiVoicesSchema = new Schema({
    voice_id:String,
    name:String,
    gender:String,
    trash:Boolean,
    status:Boolean,
    createAt:Date,
    cliente_id:{type: Schema.ObjectId, ref: 'clientes'},
    preview_url:String
});

module.exports = mongoose.model('ai_voices', AiVoicesSchema);
