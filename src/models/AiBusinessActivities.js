const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const AiBusinessActivitiesSchema = new Schema({
    name:String,
    description:String
});

module.exports = mongoose.model('ai_business_activities', AiBusinessActivitiesSchema);
