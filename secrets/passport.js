const passport = require('passport');
const bcrypt = require('bcrypt-nodejs');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('../db');

// Serialize and deserialize
passport.serializeUser(function(akun, done) {
  done(null, akun.kd);
});

passport.deserializeUser(function(kd, done) {
  pool.query('SELECT * FROM akun WHERE kd='+kd, function(err, res) {
    if (err) return done(err);
    done(null, res.rows[0]);
  })
});


// Middleware
passport.use('local-login', new LocalStrategy({
  usernameField: 'nip',
  passwordField: 'password',
  passReqToCallback: true
}, function(req, nip, password, done) {
  pool.query('SELECT * FROM akun WHERE nip=$1', [nip], function (err, res) {
    if (err) return done(err);

    var akun = res.rows[0];
    

    return done(akun);
  });
}));


// Custom function to validate
exports.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};