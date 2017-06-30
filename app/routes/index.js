var signup = require('../controllers/signup.js');
var Polls = require('../models/polls.js');
var shortid = require('shortid');
var colors = require('../utils/colors.js');
var validator = require('validator');
var HIGHLIGHT_LUMINANCE = .2;
var POLLS_PER_PAGE = 20;


module.exports = function(app, passport) {


    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            res.redirect('/login');
        }
    }

    //From https://www.sitepoint.com/javascript-generate-lighter-darker-color/
    function ColorLuminance(hex, lum) {

        // validate hex string
        hex = String(hex).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        lum = lum || 0;

        // convert to decimal and change luminosity
        var rgb = "#",
            c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }

        return rgb;
    }

    function voted(req, res, poll, next) {
        var voted = false;
        var ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
        if (req.isAuthenticated()) {
            var userId = req.user._id;
            var index = poll.voterUserid.indexOf(userId);
            voted = voted || index > -1;
        } else if (ip) {
            voted = voted || poll.voterIP.indexOf(ip) > -1;
        }
        next(voted);
    }


    //TODO: Make sure output doesn't allow xxs
    function getChartData(poll, next) {
        var data = [];
        for (var i = 0; i < poll.options.length; i++) {
            data.push({
                value: poll.options[i].votes,
                color: poll.options[i].color,
                highlight: ColorLuminance(poll.options[i].color, HIGHLIGHT_LUMINANCE),
                label: poll.options[i].answer
            });
        }
        next(data);
    }

    app.route('/')
        .get(function(req, res) {
            Polls.find({}).limit(POLLS_PER_PAGE).exec(function(err, polls) {
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

    app.route('/search')
        .get(function(req, res) {
            var q = req.query.q;
            var regexp = new RegExp(q, 'i');
            Polls.find({
                'question': {
                    $regex: regexp
                }
            }).limit(POLLS_PER_PAGE).exec(function(err, polls) {
                if (err) {
                    console.log(err);
                }
                res.render('home', {
                    isLoggedIn: req.isAuthenticated(),
                    polls: polls
                });
            })
        })

    app.route('/polls/:id')
        .get(function(req, res) { //TODO: Infinite scroll feature
            var id = req.params.id;
            if (shortid.isValid(id)) {
                Polls.findOne({
                    _id: id
                }, function(err, poll) {
                    if (err) {
                        console.log(err);
                    } else if (poll) {
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
                if (err) {
                    console.log(err);
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
                                if (answer == poll.options[i].id) {
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
                            var ip = req.headers['x-forwarded-for'] ||
                                req.connection.remoteAddress ||
                                req.socket.remoteAddress ||
                                req.connection.socket.remoteAddress;
                            if (ip) {
                                poll.voterIP.push(ip);
                            }
                            poll.save(function(err, savedPoll) {
                                if (err) {
                                    console.log(err)
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
        .delete(isLoggedIn, function(req, res) {
            var pollId = req.body.pollId;
            var userId = req.user._id;
            Polls.findOne({
                _id: pollId
            }, function(err, poll) {
                if (err) {
                    console.log(err);
                }
                if (poll && poll.creatorUserid == userId) {
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
        if (req.accepts('html')) {
            res.render('404');
        } else {
            res.status(404)
                .type('text')
                .send('Not Found');
        }
    });
};
