var signup = require('../controllers/signup');
var Polls = require('../models/polls');
var shortid = require('shortid');
var colors = require('../utils/colors');
var validator = require('validator');
var errorMessages = require('../utils/errorMessages');
var logger = require('../utils/logger');
var escapeStringRegexp = require('escape-string-regexp');
var POLLS_PER_PAGE = 20;


module.exports = function(app, passport) {


    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.redirect('/login');
        }
    }

    function ipAddress(req) {
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    }

    function voted(req, res, poll, next) {
        var voted = false;
        var ip = ipAddress(req);
        if (req.isAuthenticated()) {
            var userId = req.user._id;
            var index = poll.voterUserid.indexOf(userId);
            voted = index > -1;
        } else if (ip) {
            voted = poll.voterIP.indexOf(ip) > -1;
        }
        next(voted);
    }

    function getChartData(poll, next) {
        var data = [];
        for (var i = 0; i < poll.options.length; i++) {
            data.push({
                value: poll.options[i].votes,
                color: poll.options[i].color,
                highlight: colors.ColorLuminance(poll.options[i].color, colors.HIGHLIGHT_LUMINANCE),
                label: poll.options[i].answer
            });
        }
        next(data);
    }

    app.route('/')
        .get(function(req, res) {
            Polls.find({}).limit(POLLS_PER_PAGE).exec(function(err, polls) {
                logger.error(err)
                res.render('home', {
                    isLoggedIn: req.isAuthenticated(),
                    polls: polls
                });
            })
        });

    function authPage(req, res, pageName) {
        var pageParams = {
            isLoggedIn: req.isAuthenticated()
        }
        if (req.query.err === 'error') {
            pageParams.msg = {
                text: errorMessages[pageName],
                alert: 'alert-danger'
            };
        }
        if (req.query.err === 'short') {
            pageParams.msg = {
                text: errorMessages['short'],
                alert: 'alert-danger'
            };
        }
        res.render(pageName, pageParams);
    }

    app.route('/login')
        .get((req, res) => authPage(req, res, 'login'))
        .post(passport.authenticate('local', {
            failureRedirect: '/login?err=error'
        }), (req, res) => {
            res.redirect('/profile');
        });

    app.route('/signup')
        .get((req, res) => authPage(req, res, 'signup'))
        .post(signup,
            passport.authenticate('local', {
                failureRedirect: '/login?err=error'
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
                logger.error(err)
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

    app.route('/search')
        .get(function(req, res) {
            var q = escapeStringRegexp(req.query.q);
            var regexp = new RegExp(q, 'i');
            Polls.find({
                'question': {
                    $regex: regexp
                }
            }).limit(POLLS_PER_PAGE).exec(function(err, polls) {
                logger.error(err)
                res.render('home', {
                    isLoggedIn: req.isAuthenticated(),
                    polls: polls
                });
            })
        })

    app.route('/polls/:id')
        .get(function(req, res) {
            var id = req.params.id;
            if (shortid.isValid(id)) {
                Polls.findOne({
                    _id: id
                }, function(err, poll) {
                    logger.error(err)
                    if (poll) {
                        voted(req, res, poll, function(voted) {
                            getChartData(poll, function(data) {
                                res.render('poll', {
                                    isLoggedIn: req.isAuthenticated(),
                                    question: poll.question,
                                    options: poll.options,
                                    createdDate: poll.date,
                                    pollId: poll.id,
                                    chartData: data,
                                    voted: voted
                                });
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
            var question = validator.escape(req.body.question);
            var inputOptions = req.body.options;
            var verifiedOptions = [];
            var colorSeed = Math.floor(Math.random() * colors.colors.length);
            for (var i in inputOptions) {
                if (i.match(/answer[0-9]+/)) {
                    var cleanAnswer = validator.escape(inputOptions[i]);
                    verifiedOptions.push({
                        answer: cleanAnswer,
                        votes: 0,
                        color: colors.colors[(++colorSeed) % colors.colors.length]
                    })
                }
            }
            var poll = new Polls({
                question: question,
                options: verifiedOptions,
                creatorUserid: req.user._id
            });
            poll.save(function(err, data) {
                if (logger.error(err)) {
                    res.render('make', {
                        isLoggedIn: req.isAuthenticated(),
                        msg: "Error while making poll."
                    })
                } else {
                    res.redirect('/polls/' + data._id);
                }
            });
        })

    app.route('/api/vote')
        .post(function(req, res) {
            var pollId = req.body.poll; //Poll ID
            var answer = req.body.answer; //Answer ID
            Polls.findOne({
                _id: pollId
            }, function(err, poll) {
                if (logger.error(err)) {
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
                                if (answer === poll.options[i].id) {
                                    poll.options[i].votes++;
                                    found = true;
                                    break;
                                }
                            }
                            if (!found) {
                                var randomColor = colors.colors[Math.floor(Math.random() * colors.colors.length)];
                                var cleanAnswer = validator.escape(answer); //Prevent XSS
                                poll.options.push({
                                    answer: cleanAnswer,
                                    votes: 1,
                                    color: randomColor
                                })
                            }
                            if (req.isAuthenticated()) {
                                var userId = req.user._id;
                                poll.voterUserid.push(userId);
                            }
                            var ip = ipAddress(req);
                            if (ip) {
                                poll.voterIP.push(ip);
                            }
                            poll.save(function(err, savedPoll) {
                                if (logger.error(err)) {
                                    res.json({
                                        "error": "Poll not saved."
                                    });
                                } else if (!found) {
                                    //Refresh page
                                    res.json({
                                        "success": "Vote counted."
                                    })
                                } else {
                                    res.json({
                                        "success": "Vote counted.",
                                        "answerId": answer
                                    });
                                }
                            });
                        }
                    })
                }
            })
        });

    app.route('/api/delete')
        .post(isLoggedIn, function(req, res) {
            var pollId = req.body.pollId;
            var userId = req.user._id;
            Polls.findOne({
                _id: pollId,
                creatorUserid: userId
            }, function(err, poll) {
                logger.error(err)
                if (poll) {
                    poll.remove();
                    res.json({
                        success: "Poll Deleted"
                    });
                } else {
                    res.json({
                        error: "Error when trying to delete a poll."
                    });
                }
            });
        });

    //404 Not Found
    app.use((req, res, next) => {
        res.status(404)
        if (req.accepts('html')) {
            res.render('404');
        } else {
            res.type('text')
                .send('Not Found');
        }
    });
};
