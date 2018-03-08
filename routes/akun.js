const { Router } = require('express');
const bcrypt = require("bcrypt-nodejs");
const pool = require('../db');
const passport = require('passport');
const passportConf = require('../secrets/passport');
const router = Router();

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('accounts/login', { message: req.flash('login message') });
});

router.post('/login', passport.authenticate('local-login', {
  successRedirect: '/profile',
  failureRedirect: '/login'
}), function(err, user, info) {
  console.log(err);
});

router.get('/profile', passportConf.isAuthenticated, function(req, res, next) {
  pool.query('SELECT * FROM akun WHERE nip=$1', [req.akun.nip], function (err, res) {
    if (err) return next(err);
    res.render('accounts/profile', { akun: res.rows[0] });
  });
});

router.get('/signup', function(req, res) {
  res.render('accounts/signup', {
    errors: req.flash('errors')
  });
});

router.post('/signup', function(req, res, next) {  
  pool.query('SELECT * FROM akun WHERE nip=$1', [req.body.nip], function(err, existingUser) {
    if(existingUser.rows[0]){
      req.flash('errors', req.body.nip + " is already exist");
      return res.redirect('/signup');
    }else{
      bcrypt.genSalt(10, function(err1, salt) {
        if(err1) return next(err1);

        bcrypt.hash(req.body.password, salt, null, function (err2, hash) {
          if(err2) return next(err2);
          
          var password = hash;
          
          pool.query('SELECT (coalesce(max(kd),0)+1) as kd FROM akun', (err3, kodegen) => {
            if (err3) return next(err3);

            pool.query('INSERT INTO akun(kd, nip, nama, password) VALUES($1, $2, $3, $4)', [kodegen.rows[0].kd, req.body.nip, req.body.nama, password], (err4, res) => {
              if (err4) return next(err4);
              res.redirect('/login');
            });
          });
        });
      });
    }
  });
});

module.exports = router;