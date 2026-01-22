const mongoose = require('./mongoose');
const Schema = mongoose.Schema;

const CampaignsSchema = new Schema({
  name: String,
  description: String,
  createAt: Date,
  startDate: Date,
  endDate: Date,
  chat_id:{type: Schema.ObjectId, ref: 'chats'},
  deleted: Boolean,
  status: Boolean
});



module.exports = mongoose.model('campaigns', CampaignsSchema);
