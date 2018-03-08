var LocalStrategy   = require('passport-local').Strategy,
    ModelAkun       = require('../models/akun'),
    bcrypt          = require('bcrypt-nodejs');

module.exports = function(passport) {
    passport.serializeUser(function(akun, done) {
        done(null, akun.kd);
    });

    passport.deserializeUser(function (kd, done) {
        ModelAkun.grabAkunCredentials(kd, function(err, akun) {
            done(err, akun);
        });
    });

    passport.use(new LocalStrategy({
        usernameField: 'nip',
        passwordField: 'password'
    }, function(nip, password, done) {
        new ModelAkun.Akun({nip: nip}).fetch().then(function(data) {
            var akun = data;
            if (akun === null) {
                return done(null, false, { message: 'Invalid nip or password' });
            } else {
                akun = data.toJSON();
                if (!bcrypt.compareSync(password, akun.password)) {
                    return done(null, false, { message: 'Invalid password' });
                } else {
                    return done(null, akun);
                }
            }
        });
    }));
}