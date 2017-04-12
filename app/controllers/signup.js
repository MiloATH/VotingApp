var User = require('../models/users.js');
var bcrypt = require('bcrypt');

module.exports = function(req, res, next) {
    User.findOne({
        username: req.body.username
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
                username: req.body.username,
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
