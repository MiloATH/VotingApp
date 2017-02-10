'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
	github: {
		id: Schema.Types.ObjectId,
		displayName: String,
		username: String,
      publicRepos: Number
	}
});

module.exports = mongoose.model('User', User);
