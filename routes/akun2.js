const { Router } = require('express');
const router = Router();
//const pool = require('../db');
const passport = require('passport');
const bcrypt = require('bcrypt-nodejs');

var ModelAkun = require('../models/akun');

router.get('/profile', (req, res, next) => {
    if (!req.isAuthenticated()) {
        res.redirect('/signin');
    } else {
        res.render('accounts/profile', {nama_user: req.user.local.nama});
    }
});

router.get('/signin', function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/profile');
    } else {
        res.render('accounts/login', { errorMessage: '' });
    }
});

router.post('/signin', function(req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/signin'
    }, function(err, akun, info) {
        if (err) {
            return res.render('accounts/login', { errorMessage: err.message });
        }

        if (!akun) {
            return res.render('accounts/login', { errorMessage: info.message });
        }

        return req.logIn(akun, function(err) {
            if (err) {
                return res.render('accounts/login', { errorMessage: err.message });
            } else {
                return res.redirect('/profile');
            }
        });
    })(req, res, next);
});

router.get('/signup', function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/profile');
    } else {
        res.render('accounts/signup', { errorMessage: '' });
    }
});

router.post('/signup', function(req, res, next) {
    var akun = req.body;

    var nipPromise = new ModelAkun.Akun({ nip: akun.nip }).fetch();

    return nipPromise.then(function (model) {
        if (model) {
            res.render('accounts/signup', { errorMessage: 'Username already exists' });
        } else {
            var password = akun.password;
            var hash = bcrypt.hashSync(password);

            ModelAkun.kodeGen(function(err, kode) {
                if (err) return next(err);

                var signUpAkun = new ModelAkun.Akun({
                    kd: kode,
                    nip: akun.nip,
                    nama: akun.nama,
                    password: hash
                });
    
                signUpAkun.save({}, {method: 'insert'}).then(function(model) {
                    res.redirect(307, '/signin');
                });
            });
        }
    });
});

router.get('/signout', function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/profile', { errorMessage: 'You are not logged in' });
    } else {
        req.logout();
        res.redirect('/signin');
    }
});

module.exports = router;