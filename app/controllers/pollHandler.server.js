'use strict';

var Users = require('../models/users.js');

function pollHandler() {

	this.getPolls = function (req, res) {
		Users
			.findOne({ 'github.id': req.user.github.id }, { '_id': false })
			.exec(function (err, result) {
				if (err) { throw err; }
				res.json(result.polls);
			});
	};

	this.vote = function (req, res) {
		Polls
			.findOneAndUpdate({ 'id': req.poll.id }, { $inc: { 'nbrClicks.clicks': 1 } })
			.exec(function (err, result) {
					if (err) { throw err; }

					res.json(result.nbrClicks);
				}
			);
	};

}

module.exports = PollHandler;
