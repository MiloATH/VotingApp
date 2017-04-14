var signup = require('../controllers/signup.js');
var Polls = require('../models/polls.js');
var shortid = require('shortid');

module.exports = function(app, passport) {


    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.redirect('/login');
        }
    }

    app.route('/')
        .get(function(req, res) {
            Polls.find({}).limit(20).exec(function(err, polls) {
                if (err) {
                    console.log(err);
                }
                res.render('home', {
                    isLoggedIn: req.isAuthenticated(),
                    polls: polls
                });
            })
        });

    app.route('/login')
        .get(function(req, res) {
            res.render('login', {
                isLoggedIn: req.isAuthenticated()
            });
        })
        .post(passport.authenticate('local', {
            failureRedirect: '/login' //TODO: Should tell the user there was an error.
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
                failureRedirect: '/signup' //TODO: Should tell the user there was an error.
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
            Polls.find({
                creatorUserid: req.user._id
            }, function(err, polls) {
                res.render('profile', {
                    isLoggedIn: req.isAuthenticated(),
                    id: req.user._id,
                    username: req.user.username,
                    myPolls: polls
                });
            })

        });
    app.route('/make')
        .get(isLoggedIn, function(req, res) {
            res.render('make', {
                isLoggedIn: req.isAuthenticated()
            });
        });

    app.route('/polls/:id')
        .get(function(req, res) {
            var id = req.params.id;
            if (shortid.isValid(id)) {
                Polls.findOne({
                    _id: id
                }, function(err, poll) {
                    if (err) {
                        console.log(err);
                    }
                    var voted = (req.isAuthenticated()) ?
                        poll.voterUserid.includes(req.user.id) : false;
                    res.render('poll', {
                        isLoggedIn: req.isAuthenticated(),
                        question: poll.question,
                        options: poll.options,
                        createdDate: poll.date,
                        voted: voted,
                        _id: poll.id
                    });
                });
            }
        });
    //API
    app.route('/api/makePoll')
        .post(isLoggedIn, function(req, res) {
            var question = req.body.question;
            var inputOptions = req.body.options;
            var verifiedOptions = [];
            for (var i in inputOptions) {
                if (i.match(/answer[0-9]+/)) {
                    verifiedOptions.push({
                        "answer": inputOptions[i],
                        "votes": 0
                    })
                }
            }
            var poll = new Polls({
                question: question,
                options: verifiedOptions,
                creatorUserid: req.user._id
            });
            poll.save(function(err, data) {
                if (err) {
                    console.log(err);
                    res.render('make', {
                        isLoggedIn: req.isAuthenticated(),
                        msg: "Error while making poll."
                    })
                } else {
                    res.redirect('/polls/' + data._id); //TODO: redirect to new poll
                }
            });
        })

    app.route('/api/vote/')
        .post(function(req, res) {
            var pollId = req.body.poll;
            var answer = req.body.answer;
            Polls.findOne({
                _id: pollId
            }, function(err, poll) {
                //console.log(poll);
                /*if((req.isAuthenticated()) ?
                    poll.voterUserid.includes(req.user.id) : false){
                        //User already voted
                    }*/
                var found = false;
                for (var i = 0; i < poll.options.length; i++) {
                    if (answer == poll.options[i].answer) {
                        poll.options[i].votes++;
                        found = true;
                    }
                }
                if (!found) {
                    poll.options.push({
                        answer: answer,
                        votes: 0
                    })
                }
                if (req, isAuthenticated()) {
                    poll.voterUserid.push(req.user._id);
                }
                poll.save();
                res.redirect('/polls/' + pollId);
            })

        });

    app.route('/api/delete')
        .delete(isLoggedIn, function(req, res) {
            var pollId = req.body.pollId;
            var userId = req.user._id;
            Polls.findOne({
                _id: pollId
            }, function(err, poll) {
                if (err) {
                    console.log(err);
                    res.json({
                        error: "Error when trying to delete a poll"
                    });
                }
                if (poll && poll.creatorUserid == userId) {
                    poll.remove();
                    res.json({
                        success: "Poll Deleted"
                    });
                    //res.redirect('/profile');
                }
            });
        });
};
