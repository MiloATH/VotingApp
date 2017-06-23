process.env.NODE_ENV = 'test';

var chai = require('chai');
var assert = chai.assert;
var chaiHttp = require('chai-http');
chai.use(chaiHttp);
var browser = require('zombie');

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

});
