const LocalStrategy = require('passport-local');
const User = require('../models/users');
const bcrypt = require('bcrypt');
const validator = require('validator');

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new LocalStrategy(
      function(username, password, done) {
        username = validator.escape(username);
        User.findOne({
          username: username,
        }, function(err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false);
          }
          if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false);
          }
          return done(null, user);
        });
      },
  ));
};
