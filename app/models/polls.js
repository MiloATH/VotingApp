var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

var Poll = new Schema({
    _id: {
        type: String,
        'default': shortid.generate
    },
    question: String,
    options: [{
        answer: String,
        votes: Number
    }],
    creatorUserid: String,
    voterUserid: [],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Poll', Poll);
