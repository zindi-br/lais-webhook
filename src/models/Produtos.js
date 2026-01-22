const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const ProdutosSchema = new Schema({
    cuk: String,
    produto: String,
    name: String,
    desc_cor_produto: String,
    cor_produto:String,
    griffe: String,
    grade:String,
    dataTranferencia: Date,
    grupo_produto: String,
    subgrupo_produto:String,
    regular_price: Number,
    cod_filial:String,
    foto_base64:String,
    estoque:Number,
    isFoto:Number

});

module.exports = User = mongoose.model('products', ProdutosSchema);
