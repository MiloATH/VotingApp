const mongoose = require('mongoose');
const shortid = require('shortid');
const Schema = mongoose.Schema;

const Poll = new Schema({
  _id: {
    type: String,
    default: shortid.generate,
  },
  question: String,
  options: [{
    answer: String,
    votes: Number,
    color: String,
    _id: {
      type: String,
      default: shortid.generate,
    },
  }],
  creatorUserid: String,
  voterUserid: [],
  voterIP: [],
  date: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('Poll', Poll);
