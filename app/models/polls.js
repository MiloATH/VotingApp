'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Poll = new Schema({
    id: Schema.Types.ObjectId,
    question: String,
    options: [{ answer: String, vote: Number }],
    creatorUserid: String,
    voterUserid: [],
});

module.exports = mongoose.model('Poll', Poll);
