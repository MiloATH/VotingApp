var User = require('../models/users.js');
var bcrypt = require('bcrypt');
var validator = require('validator');

module.exports = function(req, res, next) {
    var username = validator.escape(req.body.username);
    if(req.body.password.length < 10){
      res.redirect('/signup?err=short');
    }
    else {
        User.findOne({
            username: username
        }, function(err, user) {
            if (err) {
                return next(err);
            } else if (user) {
                res.redirect('/signup?err=error');
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
                        return next(null, user);
                    }
                });
            }
        })
    }
};
