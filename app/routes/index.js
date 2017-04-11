var signup = require('../controllers/signup.js');
var Polls = require('../models/polls.js');

module.exports = function(app, passport) {


	function isLoggedIn(req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		}
		else {
			res.redirect('/login');
		}
	}

	app.route('/')
		.get(function(req, res) {
			res.render('home', {
				isLoggedIn: req.isAuthenticated()
			});
		});

	app.route('/login')
		.get(function(req, res) {
			res.render('login', {
				isLoggedIn: req.isAuthenticated()
			});
		})
		.post(passport.authenticate('local', {
            failureRedirect: '/login'//TODO: Should tell the user there was an error.
        }), (req, res) => {
            res.redirect('/profile');
        });

	app.route('/signup')
		.get(function(req, res) {
			res.render('signup', {
				isLoggedIn: req.isAuthenticated()
			});
		})
		.post(signup,
			passport.authenticate('local', {
				failureRedirect: '/signup'//TODO: Should tell the user there was an error.
			}),
			(req, res, next) => {
				res.redirect('/profile');
			});

	app.route('/logout')
		.get(function(req, res) {
			req.logout();
			res.redirect('/login');
		});

	app.route('/profile')
		.get(isLoggedIn, function(req, res) {
			res.render('profile', {
				isLoggedIn: req.isAuthenticated()
			});
		});

	//API
	app.route('/api/vote')
		.post(isLoggedIn, function(req, res) {
			var pollId = req.body.poll;
			var vote = req.body.vote;
			
		});

};
