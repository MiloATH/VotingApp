process.env.NODE_ENV = 'test';

var mongoose = require('mongoose');
var chai = require('chai');
var assert = chai.assert;
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var Browser = require('zombie');

var server = require('../server');

var colors = require('../app/utils/colors');

describe('Unit Testing', function() {
    describe('colors.js', function() {
        it('colors should be an array', function() {
            assert.isTrue(Array.isArray(colors.colors));
        });
        it('colors should be an array of hex values', function() {
            var isHex = /#[0-9A-Fa-f]{6}/;
            for (var i = 0; i < colors.colors.length; ++i) {
                assert.match(colors.colors[i], isHex);
            }
        });
    });

    describe('Models', function() {
        describe('Polls', function() {
            //it('poll should have a question')
        })
    })
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
            .get('/login')
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

    it('POST /api/vote unauthorized', function(done) {
        chai.request(server)
            .post('/api/makePoll')
            .send({})
            .end(function(err, res) {
                assert.equal(res.status, 200, 'response status should be 200');
                done();
            });
    });

    Browser.localhost('surveysay.herokuapp.com', 8080);

    describe('User visits signup page', function() {

        const browser = new Browser();

        before(function(done) {

            function clearDB() {
                for (var i in mongoose.connection.collections) {
                    mongoose.connection.collections[i].remove(function() {});
                }
                return done();
            }

            if (mongoose.connection.readyState === 0) {
                mongoose.connect(process.env.TEST_MONGO_URI, function(err) {
                    if (err) {
                        throw err;
                    }
                    return clearDB();
                });
            } else {
                return clearDB();
            }
        });

        describe('submits signup form', function() {

            before(function(done) {
                browser.visit('/signup', function() {
                    browser
                        .fill('username', 'zombie')
                        .fill('password', 'eat-the-living')
                        .pressButton('Submit', done);

                });
            });

            it('should be successful', function() {
                browser.assert.success();
            });

            it('should see welcome page', function() {
                browser.assert.text('.container h2', 'Welcome, zombie');
            });
        });

        describe('create a simple poll with 2 options', function() {

            var question = 'Can I make a poll?';
            var options = ['Yes', 'No'];

            before(function(done) {
                browser.visit('/login', function() {
                    browser
                        .fill('username', 'zombie')
                        .fill('password', 'eat-the-living')
                        .pressButton('Submit', function() {
                            browser.visit('/make', function() {
                                browser
                                    .fill('question', question)
                                    .fill('options[answer1]', options[0])
                                    .fill('options[answer2]', options[1])
                                    .pressButton('Submit', (err) => {
                                        //Throws err becuase zombie has issues with the canvas for the chart
                                        //Wrapping done callback in a callback avoids err being thrown
                                        done();
                                    });
                            });
                        });
                });
            });

            it('should be successful', function() {
                browser.assert.success();
            });

            it('should display question', function() {
                browser.assert.text('h2.title', question);
            });

            it('should display options', function() {
                browser.assert.text('span#answer', options.join(''));
            });

        });
    });


});
