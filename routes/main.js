const { Router } = require('express');
const pool = require('../db');
const router = Router();
const passport = require('passport');
const config = require('../secrets/configuration');

router.get('/', (request, response, next) => {
  if (!request.isAuthenticated()) {
    response.redirect('/signin');
  } else {
    config.clearArray(config.active);
    config.active.dashboard = "active";
    response.render('main/dashboard', {
      judul: 'DASHBOARD',
      nama_user: request.user.local.nama,
      akses_user: request.user.local.akses,
      active: config.active
    });
  }
});

module.exports = router;