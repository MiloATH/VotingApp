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

    function voted(req, res, poll, next) {
        var voted = false;
        if (req.isAuthenticated()) {
            var userId = req.user._id;
            var voted = poll.voterUserid.indexOf(userId);
            voted = voted || voted > -1;
        }
        if (req.ip) {
            voted = voted || poll.voterIP.indexOf(req.ip) > -1;
        }
        next(voted);
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
                    } else if (poll) {
                        voted(req, res, poll, function(voted) {
                            res.render('poll', {
                                isLoggedIn: req.isAuthenticated(),
                                question: poll.question,
                                options: poll.options,
                                createdDate: poll.date,
                                pollId: poll.id,
                                voted: voted
                            });
                        });
                    } else {
                        res.render('404', {
                            msg: "Poll not found."
                        });
                    }
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

    app.route('/api/vote')
        .post(function(req, res) {
            var pollId = req.body.poll;
            var answer = req.body.answer;
            Polls.findOne({
                _id: pollId
            }, function(err, poll) {
                if (err) {
                    console.log(err);
                    res.json({
                        "error": "Poll not found. Vote not counted."
                    });
                    return;
                } else if (poll) {
                    voted(req, res, poll, function(voted) {
                        if (voted) {
                            res.json({
                                "error": "Already voted."
                            });
                            return;
                        } else {
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
                            if (req.isAuthenticated()) {
                                poll.voterUserid.push(req.user._id);
                            }
                            if (req.ip) {
                                poll.voterIP.push(req.ip);
                            }
                            poll.save(function(err, savedPoll) {
                                if (err) {
                                    console.log(err)
                                    res.json({
                                        "error": "Poll not saved."
                                    });
                                } else {
                                    res.json({
                                        "success": "Vote counted."
                                    });
                                }
                            });
                        }
                    })
                }
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

    //404 Not Found
    app.use((req, res, next) => {
        if (req.accepts('html')) {
            res.render('404');
        } else {
            res.status(404)
                .type('text')
                .send('Not Found');
        }
    });
};
