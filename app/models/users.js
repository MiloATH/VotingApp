'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	id: Schema.Types.ObjectId,
	github: {
		displayName: String,
		username: String,
		publicRepos: Number
	}
});

module.exports = mongoose.model('User', User);
