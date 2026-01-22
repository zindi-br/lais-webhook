const mongoose = require('../../../mongoose');
const Schema = mongoose.Schema;

const CobConadSchema = new Schema({
  
    st_cpf_con: String,
    link_segundavia:String
   
});

module.exports = User = mongoose.model('cobrancasconad', CobConadSchema);
