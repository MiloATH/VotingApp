var assert = require('chai').assert
var colors = require('../app/utils/colors.js');

describe('color.js', function() {
    describe('#hexColors', function() {
        it('should be an array', function() {
            assert.isTrue(Array.isArray(colors.colors));
        });
        it('should be an array of hex values', function() {
            var isHex = /#[0-9A-Fa-f]{6}/;
            for (var i = 0; i < colors.colors.length; ++i) {
                assert.match(colors.colors[i], isHex);
            }
        });
    });
});
