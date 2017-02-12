'use strict';

var Users = require('../models/users.js');
var Polls = require('../models/polls.js');

function pollHandler() {

	this.getMyPolls = function(req, res) {
		Users.findOne({
				'github.id': req.user.github.id
			}, {
				'_id': false
			})
			.exec(function(err, result) {
				if (err) {
					throw err;
				}
				res.json(result.polls);
			});
	};


	this.getRecentPolls = function(req, res) {
		Polls.find({
			date: {
				$lt: 16085
			}
		}).sort({
			date: -1
		}).limit(20).exec((err, results) => {
			if(err){
				throw err;
			}
			res.json(results)
		});

	};

	this.vote = function(req, res) {
		Polls.findOneAndUpdate({
				'id': req.poll.id
			}, {
				$inc: {
					'nbrClicks.clicks': 1
				}
			})
			.exec(function(err, result) {
				if (err) {
					throw err;
				}

				res.json(result.nbrClicks);
			});
	};

}

module.exports = pollHandler;
