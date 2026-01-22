const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const LogsPromptsAiSchema = new Schema({
        date: Date,
        log:Object
});

module.exports = mongoose.model('aiPromptLogs', LogsPromptsAiSchema);
