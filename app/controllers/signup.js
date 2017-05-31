var User = require('../models/users.js');
var bcrypt = require('bcrypt');
var validator = require('validator');

module.exports = function(req, res, next) {
    var username = validator.escape(req.body.username);
    User.findOne({
        username: username
    }, function(err, user) {
        if (err) {
            next(err);
        } else if (user) {
            res.render('signup', {
                msg: "Username already taken.",
                isLoggedIn: req.isAuthenticated()
            });
        } else {
            var hash = bcrypt.hashSync(req.body.password, 8);
            var newUser = new User({
                username: username,
                password: hash
            });
            newUser.save((err, doc) => {
                if (err) {
                    res.redirect('/');
                } else {
                    next(null, user);
                }
            });

        }
    })
};
