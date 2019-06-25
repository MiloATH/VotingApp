process.env.NODE_ENV = 'test';

var mongoose = require('mongoose');
var chai = require('chai');
var assert = chai.assert;
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var Browser = require('zombie');

var server = require('../server');

var colors = require('../app/utils/colors');
var Users = require('../app/models/users');
var Polls = require('../app/models/polls');
var passport = require('../app/config/passport');
var DBClear = require('./DBClear');

var pollID;
var userID;

before(DBClear.connectAndClearDB);

after(DBClear.connectAndClearDB);

describe('Unit Testing', function() {

    describe('colors.js', function() {
        it('colors should be an array', function(done) {
            assert.isTrue(Array.isArray(colors.colors));
            done();
        });

        it('colors should be an array of hex values', function(done) {
            var isHex = /#[0-9A-Fa-f]{6}/;
            for (var i = 0; i < colors.colors.length; ++i) {
                assert.match(colors.colors[i], isHex);
            }
            done();
        });

        it('HIGHLIGHT_LUMINANCE should have a value', function(done){
            assert(typeof colors.HIGHLIGHT_LUMINANCE === 'number');
            done();
        })

        it('ColorLuminance should accept a hex color of length 6 and return a color', function(done){
            assert.equal(colors.ColorLuminance('#f6e550', colors.HIGHLIGHT_LUMINANCE), '#ffff60');
            done();
        });

        it('ColorLuminance should accept a hex color of length 3 and return a color', function(done){
            assert.equal(colors.ColorLuminance('#fe5', colors.HIGHLIGHT_LUMINANCE), '#ffff66');
            done();
        })
    });

    describe('Models', function() {

        describe('Users', function() {
            it('should create a new User', function(done) {
                var user = {
                    username: 'user',
                    password: 'unhashed-password-0'
                };
                Users.create(user, function(err, newUser) {
                    assert.isNotOk(err, 'Error while creating new user');
                    assert.equal(user.username, newUser.username, 'The new user doesn\'t have the correct username');
                    assert.equal(user.password, newUser.password, 'The new user doesn\'t have the correct password');
                    userID = newUser._id;
                    done();
                });
            });
        });

        describe('Polls', function() {
            it('should create a new Poll', function(done) {
                poll = {
                    question: 'Sample question: I can create a poll',
                    options: [{
                            answer: 'First Option',
                            votes: 0,
                            color: '#00c64a'
                        },
                        {
                            answer: 'Second Option',
                            votes: 0,
                            color: '#00b67f'
                        }
                    ],
                    creatorUserid: userID
                };
                Polls.create(poll, function(err, newPoll) {
                    pollID = newPoll._id;
                    assert.isNotOk(err, 'Error while creating new poll');
                    assert.equal(poll.question, newPoll.question, 'The new poll doesn\'t have the correct question');
                    for (var i = 0; i < poll.options.length; ++i) {
                        assert.equal(poll.options[i].answer, newPoll.options[i].answer, 'The new poll doesn\'t have the correct answer');
                        assert.equal(poll.options[i].votes, newPoll.options[i].votes, 'The new poll doesn\'t have the correct votes');
                        assert.equal(poll.options[i].color, newPoll.options[i].color, 'The new poll doesn\'t have the correct color');
                    }
                    done();
                });
            });
        });

    });
});

describe('Integration Testing', function() {
    it('GET /', function(done) {
        chai.request(server)
            .get('/')
            .end(function(err, res) {
                assert.equal(res.status, 200, 'response status should be 200');
                done();
            });
    });

    it('GET /signup', function(done) {
        chai.request(server)
            .get('/signup')
            .end(function(err, res) {
                assert.equal(res.status, 200, 'response status should be 200');
                done();
            })
    })

    it('GET /login', function(done) {
        chai.request(server)
            .get('/login')
            .end(function(err, res) {
                assert.equal(res.status, 200, 'response status should be 200');
                done();
            });
    });

    it('GET /logout', function(done) {
        chai.request(server)
            .get('/logout')
            .end(function(err, res) {
                assert.equal(res.status, 200, 'response status should be 200');
                done();
            });
    });

    it('GET /profile', function(done) {
        chai.request(server)
            .get('/profile')
            .end(function(err, res) {
                assert.equal(res.status, 200, 'response status should be 200');
                done();
            });
    });

    it('GET /make', function(done) {
        chai.request(server)
            .get('/make')
            .end(function(err, res) {
                assert.equal(res.status, 200, 'response status should be 200');
                done();
            });
    });

    it('GET /search', function(done) {
        chai.request(server)
            .get('/search')
            .end(function(err, res) {
                assert.equal(res.status, 200, 'response status should be 200');
                done();
            });
    });

    it('GET /not-a-page', function(done) {
        chai.request(server)
            .get('/not-a-page')
            .end(function(err, res) {
                assert.equal(res.status, 404, 'response status should be 404');
                done();
            });
    });

    Browser.localhost(process.env.siteURL.replace(/http[s]?:\/\//g, ''), 8080);

    describe('e2e testing', function() {

        const browser = new Browser();

        var question = 'Can I make a poll?';
        var options = ['Yes', 'No'];

        before(function(done) {
            browser.visit('/polls/' + pollID, function(err) {
                //Throws err becuase zombie has issues with the canvas for the chart
                //Wrapping done callback in a callback avoids err being thrown
                done();
            });
        })

        describe('vote on a poll without authentication', function() {
            before(function(done) {
                browser.pressButton(poll.options[0].answer + ' 0', function(err) {
                    //Throws err becuase zombie has issues with the canvas for the chart
                    //Wrapping done callback in a callback avoids err being thrown
                    done();
                });
            });

            it('should tell the user the vote counted', function(done) {
                browser.assert.text('.alert.fixed-msg', 'Vote counted.');
                done();
            });

            it('should increase the number of votes by 1', function(done) {
                browser.assert.text('span#votes', '1' + '0'.repeat(poll.options.length - 1));
                done();
            });

        });

        describe('submits signup form', function() {

            before(function(done) {
                browser.visit('/signup', function() {
                    browser.fill('username', 'zombie').then(function() {
                        browser.fill('password', 'eat-the-living').then(function() {
                            browser.pressButton('Submit', done);
                        });
                    });
                });
            });

            it('should be successful', function(done) {
                browser.assert.success();
                done();
            });

            it('should see welcome page', function(done) {
                browser.assert.text('.container h2', 'Welcome, zombie');
                done();
            });
        });

        describe('create a simple poll with 2 options', function() {

            before(function(done) {
                browser.visit('/make', function() {
                    browser.fill('question', question).then(function() {
                        browser.fill('options[answer1]', options[0]).then(function() {
                            browser.fill('options[answer2]', options[1]).then(function() {
                                browser.pressButton('Submit', function(err) {
                                    // Throws err because zombie has issues with the canvas for the chart
                                    // Wrapping done callback in a callback avoids err being thrown
                                    done();
                                })
                            })
                        })
                    });
                });
            });

            it('should be successful', function(done) {
                browser.assert.success();
                done();
            });

            it('should display the question', function(done) {
                browser.assert.text('h2.title', question);
                done();
            });

            it('should display the options', function(done) {
                browser.assert.text('span#answer', options.join(''));
                done();
            });

            it('should display the options vote count as 0', function(done) {
                browser.assert.text('span#votes', '0'.repeat(options.length));
                done();
            });

        });

        describe('vote on poll', function() {

            var otherOption = 'Other answer';

            before(function(done) {
                browser.fill('answer', otherOption).then(function() {
                    browser.pressButton('Submit', function(err) {
                        // Throws err because zombie has issues with the canvas for the chart
                        // Wrapping done callback in a callback avoids err being thrown
                        done();
                    });
                });
            });

            it('should add the additional option', function(done) {
                browser.assert.text('#answer', options.join('') + otherOption);
                done();
            });

            it('should increase the number of votes by 1', function(done) {
                browser.assert.text('span#votes', '0'.repeat(options.length) + '1');
                done();
            });

        });

        describe('delete poll', function() {

            before(function(done) {
                browser.visit('/profile', function() {
                    browser.pressButton('X', done);
                })
            });

            it('should delete poll in database', function(done) {
                Polls.find({
                    question: question
                }).exec(function(err, polls) {
                    assert.equal(polls.length, 0,
                        'There shouldn\'t be any polls with the question: "' +
                        question + '" in the database when the poll is deleted.');
                    done();
                });
            });

            it('should not display deleted poll', function(done) {
                browser.assert.text('.list-group', '');
                done();
            });
        });

        describe('logout', function() {

            before(function(done) {
                browser.visit('/logout', function() {
                    done();
                });
            });

            it('should display login and signup in navbar', function(done) {
                browser.assert.text('ul.nav.navbar-nav.navbar-right', 'Login Signup');
                done();
            });

            it('should redirect to login page', function(done) {
                assert.equal(browser.url, process.env.siteURL + '/login');
                done();
            });
        });

        describe('fail login with incorrect password and username', function() {

            before(function(done) {
                browser.visit('/login', function() {
                    browser.fill('username', 'not-a-zombie').then(function() {
                        browser.fill('password', 'save-the-dead').then(function() {
                            browser.pressButton('Submit', done);
                        });
                    });
                });
            });

            it('should redirect to login?err=error page', function(done) {
                assert.equal(browser.url, process.env.siteURL + '/login?err=error');
                done();
            });

            it('should alert about incorrect password and username', function(done) {
                browser.assert.text('.alert-danger', 'Error during login. Username and/or password are incorrect.');
                done();
            });

            it('should display login and signup in navbar', function(done) {
                browser.assert.text('ul.nav.navbar-nav.navbar-right', 'Login Signup');
                done();
            });
        });


        describe('try to signup with an already taken username', function() {

            before(function(done) {
                browser.visit('/signup', function() {
                    browser.fill('username', 'zombie').then(function() {
                        browser.fill('password', 'example-password').then(function() {
                            browser.pressButton('Submit', done);
                        });
                    });
                });
            });

            it('should redirect to signup?err=error page', function(done) {
                assert.equal(browser.url, process.env.siteURL + '/signup?err=error');
                done();
            });

            it('should show alert about incorrect username', function(done) {
                browser.assert.text('.alert-danger', 'Error during signup. Please use a different username.');
                done();
            });

            it('should display login and signup in navbar', function(done) {
                browser.assert.text('ul.nav.navbar-nav.navbar-right', 'Login Signup');
                done();
            });
        });
    });
});
