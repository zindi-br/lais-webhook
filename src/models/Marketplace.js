const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const MarketplaceSchema = new Schema({
    marketplace:String,
    status:Boolean,
    clientes: [{type: Schema.ObjectId, ref: 'clientes'}]
});

module.exports = Marketplace = mongoose.model('marketplaces', MarketplaceSchema);
