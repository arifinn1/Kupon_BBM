const { Router } = require('express');
const pool = require('../db');
const passport = require('passport');
const passportConf = require('../secrets/passport');
const router = Router();

router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('accounts/login', { message: req.flash('login message') });
});

module.exports = router;