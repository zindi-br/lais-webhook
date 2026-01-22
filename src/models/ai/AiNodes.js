const Double = require('@mongoosejs/double/lib');
const mongoose = require('../mongoose');
const Schema = mongoose.Schema;

const AiNodesSchema = new Schema({
    label:String,
    name:String,
    version:Double,
    type:String,
    icon:String,
    category:String,
    description:String,
    baseClasses:Array,
    inputs:Array,
    inputs:Array
});

module.exports = mongoose.model('ai_nodes', AiNodesSchema);


