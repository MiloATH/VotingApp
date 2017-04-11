var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	id: Schema.Types.ObjectId,
	username: String,
	password: String
});

module.exports = mongoose.model('User', User);
