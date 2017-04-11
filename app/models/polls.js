var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Poll = new Schema({
    id: Schema.Types.ObjectId,
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
