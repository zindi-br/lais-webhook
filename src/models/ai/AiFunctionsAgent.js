const mongoose = require('../mongoose');
const Schema = mongoose.Schema;

const AiFunctionsAgentSchema = new Schema({
    name:String,
    description:String
});

module.exports = mongoose.model('ai_agent_functions', AiFunctionsAgentSchema);
