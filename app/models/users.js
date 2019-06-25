const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
  id: Schema.Types.ObjectId,
  username: String,
  password: String,
});

module.exports = mongoose.model('User', User);
