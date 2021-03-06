const signup = require('../controllers/signup');
const Polls = require('../models/polls');
const shortid = require('shortid');
const colors = require('../utils/colors');
const validator = require('validator');
const errorMessages = require('../utils/errorMessages');
const logger = require('../utils/logger');
const escapeStringRegexp = require('escape-string-regexp');
const POLLS_PER_PAGE = 20;


module.exports = function(app, passport) {
  /**
   * Redirect user to /login if not logged in,
   * otherwise calls next.
   *
   * @param {Object} req is the request.
   * @param {Object} res is the response.
   * @param {Function} next is the callback.
   * @return {undefined}
   */
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/login');
    }
  }

  /**
   * Returns IP Addresss from request.
   *
   * @param {Object} req is the request.
   * @return {string} the IP address.
   */
  function ipAddress(req) {
    return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
  }

  /**
   * Marks poll as voted on by this IP/user.
   *
   * @param {Object} req is the request.
   * @param {Object} res is the response.
   * @param {Object} poll is the voted on poll.
   * @param {Function} next is the callback.
   */
  function voted(req, res, poll, next) {
    let voted = false;
    const ip = ipAddress(req);
    if (req.isAuthenticated()) {
      const userId = req.user._id;
      const index = poll.voterUserid.indexOf(userId);
      voted = index > -1;
    } else if (ip) {
      voted = poll.voterIP.indexOf(ip) > -1;
    }
    next(voted);
  }

  /**
   * Collects data about chart and passes to next.
   *
   * @param {Object} poll is the voted on poll.
   * @param {Function} next is the callback.
   */
  function getChartData(poll, next) {
    const data = [];
    for (let i = 0; i < poll.options.length; i++) {
      data.push({
        value: poll.options[i].votes,
        color: poll.options[i].color,
        highlight: colors.colorLuminance(poll.options[i].color,
            colors.HIGHLIGHT_LUMINANCE),
        label: poll.options[i].answer,
      });
    }
    next(data);
  }

  app.route('/')
      .get(function(req, res) {
        Polls.find({}).limit(POLLS_PER_PAGE).exec(function(err, polls) {
          logger.error(err);
          res.render('home', {
            isLoggedIn: req.isAuthenticated(),
            polls: polls,
          });
        });
      });

  /**
   * Render authentication page with corresponding error.
   *
   * @param {Object} req is the request.
   * @param {Object} res is the response.
   * @param {String} pageName is the name of the template to render.
   */
  function authPage(req, res, pageName) {
    const pageParams = {
      isLoggedIn: req.isAuthenticated(),
    };
    if (req.query.err === 'error') {
      pageParams.msg = {
        text: errorMessages[pageName],
        alert: 'alert-danger',
      };
    }
    if (req.query.err === 'short') {
      pageParams.msg = {
        text: errorMessages['short'],
        alert: 'alert-danger',
      };
    }
    res.render(pageName, pageParams);
  }

  app.route('/login')
      .get((req, res) => authPage(req, res, 'login'))
      .post(passport.authenticate('local', {
        failureRedirect: '/login?err=error',
      }), (req, res) => {
        res.redirect('/profile');
      });

  app.route('/signup')
      .get((req, res) => authPage(req, res, 'signup'))
      .post(signup,
          passport.authenticate('local', {
            failureRedirect: '/login?err=error',
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
          creatorUserid: req.user._id,
        }, function(err, polls) {
          logger.error(err);
          res.render('profile', {
            isLoggedIn: req.isAuthenticated(),
            id: req.user._id,
            username: req.user.username,
            myPolls: polls,
          });
        });
      });

  app.route('/make')
      .get(isLoggedIn, function(req, res) {
        res.render('make', {
          isLoggedIn: req.isAuthenticated(),
        });
      });

  app.route('/search')
      .get(function(req, res) {
        const q = req.query.q || '';
        const regexp = new RegExp(escapeStringRegexp(q), 'i');
        Polls.find({
          'question': {
            $regex: regexp,
          },
        }).limit(POLLS_PER_PAGE).exec(function(err, polls) {
          logger.error(err);
          res.render('home', {
            isLoggedIn: req.isAuthenticated(),
            polls: polls,
          });
        });
      });

  app.route('/polls/:id')
      .get(function(req, res) {
        const id = req.params.id;
        if (shortid.isValid(id)) {
          Polls.findOne({
            _id: id,
          }, function(err, poll) {
            logger.error(err);
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
                    voted: voted,
                  });
                });
              });
            } else {
              res.render('404', {
                msg: 'Poll not found.',
              });
            }
          });
        }
      });

  // API
  app.route('/api/makePoll')
      .post(isLoggedIn, function(req, res) {
        const question = validator.escape(req.body.question);
        const inputOptions = req.body.options;
        const verifiedOptions = [];
        let colorSeed = Math.floor(Math.random() * colors.colors.length);
        for (const i in inputOptions) {
          if (i.match(/answer[0-9]+/)) {
            const cleanAnswer = validator.escape(inputOptions[i]);
            verifiedOptions.push({
              answer: cleanAnswer,
              votes: 0,
              color: colors.colors[(++colorSeed) % colors.colors.length],
            });
          }
        }
        const poll = new Polls({
          question: question,
          options: verifiedOptions,
          creatorUserid: req.user._id,
        });
        poll.save(function(err, data) {
          if (logger.error(err)) {
            res.render('make', {
              isLoggedIn: req.isAuthenticated(),
              msg: 'Error while making poll.',
            });
          } else {
            res.redirect('/polls/' + data._id);
          }
        });
      });

  app.route('/api/vote')
      .post(function(req, res) {
        const pollId = req.body.poll; // Poll ID
        const answer = req.body.answer; // Answer ID
        Polls.findOne({
          _id: pollId,
        }, function(err, poll) {
          if (logger.error(err)) {
            res.json({
              'error': 'Poll not found. Vote not counted.',
            });
            return;
          } else if (poll) {
            voted(req, res, poll, function(voted) {
              if (voted) {
                res.json({
                  'error': 'Already voted.',
                });
                return;
              } else {
                let found = false;
                for (let i = 0; i < poll.options.length; i++) {
                  if (answer === poll.options[i].id) {
                    poll.options[i].votes++;
                    found = true;
                    break;
                  }
                }
                if (!found) {
                  const randomColor = colors.colors[Math.floor(Math.random() *
                    colors.colors.length)];
                  const cleanAnswer = validator.escape(answer); // Prevent XSS
                  poll.options.push({
                    answer: cleanAnswer,
                    votes: 1,
                    color: randomColor,
                  });
                }
                if (req.isAuthenticated()) {
                  const userId = req.user._id;
                  poll.voterUserid.push(userId);
                }
                const ip = ipAddress(req);
                if (ip) {
                  poll.voterIP.push(ip);
                }
                poll.save(function(err, savedPoll) {
                  if (logger.error(err)) {
                    res.json({
                      'error': 'Poll not saved.',
                    });
                  } else if (!found) {
                    // Refresh page
                    res.json({
                      'success': 'Vote counted.',
                    });
                  } else {
                    res.json({
                      'success': 'Vote counted.',
                      'answerId': answer,
                    });
                  }
                });
              }
            });
          }
        });
      });

  app.route('/api/delete')
      .post(isLoggedIn, function(req, res) {
        const pollId = req.body.pollId;
        const userId = req.user._id;
        Polls.findOne({
          _id: pollId,
          creatorUserid: userId,
        }, function(err, poll) {
          logger.error(err);
          if (poll) {
            poll.remove();
            res.json({
              success: 'Poll Deleted',
            });
          } else {
            res.json({
              error: 'Error when trying to delete a poll.',
            });
          }
        });
      });

  // 404 Not Found
  app.use((req, res, next) => {
    res.status(404);
    if (req.accepts('html')) {
      res.render('404');
    } else {
      res.type('text')
          .send('Not Found');
    }
  });
};
