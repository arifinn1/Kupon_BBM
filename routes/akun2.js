const { Router } = require('express');
const router = Router();
const pool = require('../db');
const passport = require('passport');
const bcrypt = require('bcrypt-nodejs');
const config = require('../secrets/configuration');

var ModelAkun = require('../models/akun');

router.get('/akun', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else if (req.user.local.akses != 'master') {
    res.redirect('/');
  } else {
    config.clearArray(config.active);
    config.active.akun = "active";
    pool.query('SELECT * FROM akun', (err, data) => {
      if (err) return next(err);
      res.render('accounts/akun', {
        judul           : 'AKUN',
        nama_user       : req.user.local.nama,
        akses_user      : req.user.local.akses,
        active          : config.active,
        datatables      : true,
        loadingoverlay  : true,
        datetimepicker  : true,
        akun            : data.rows
      });
    });
  }
});

router.post('/akun', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else if (req.user.local.akses != 'master') {
    res.redirect('/');
  } else {
    var akun = req.body;

    (async () => {
      try {
        await pool.query('BEGIN');
        if (akun.onip == '') {
          let { rowCount } = await pool.query('SELECT nip FROM akun WHERE nip=$1', [akun.nip]);
          if (rowCount == 0) {
            let { rows } = await pool.query('SELECT (coalesce(max(kd),0)+1) as kd FROM akun');
            let password = akun.pass_baru != '' ? akun.pass_baru : '123456';
            let hash = bcrypt.hashSync(password);
            await pool.query('INSERT INTO akun (kd, nip, nama, password, akses) VALUES($1, $2, $3, $4, $5)', [rows[0].kd, akun.nip, akun.nama, hash, akun.akses]);
            res.send({ op: 'BARU', res: 'SUKSES', kd: rows[0].kd });
          } else {
            res.send({ op: 'BARU', res: 'KODE' });
          }
        } else {
          if (akun.onip != akun.nip) {
            let { rowCount } = await pool.query('SELECT nip FROM akun WHERE nip=$1', [akun.nip]);
            if (rowCount == 0) {
              if (akun.pass_baru != '') {
                await pool.query('UPDATE akun SET nip=$1, nama=$2, password=$3, akses=$4 WHERE kd=$5', [akun.nip, akun.nama, bcrypt.hashSync(akun.pass_baru), akun.akses, akun.kd]);
              } else {
                await pool.query('UPDATE akun SET nip=$1, nama=$2, akses=$3 WHERE kd=$4', [akun.nip, akun.nama, akun.akses, akun.kd]);
              }
              res.send({ op: 'UBAH', res: 'SUKSES' });
            } else {
              res.send({ op: 'UBAH', res: 'KODE' });
            }
          } else {
            if (akun.pass_baru != '') {
              await pool.query('UPDATE akun SET nama=$1, password=$2, akses=$3 WHERE kd=$4', [akun.nama, bcrypt.hashSync(akun.pass_baru), akun.akses, akun.kd]);
            } else {
              await pool.query('UPDATE akun SET nama=$1, akses=$2 WHERE kd=$3', [akun.nama, akun.akses, akun.kd]);
            }
            res.send({ op: 'UBAH', res: 'SUKSES' });
          }
        }
        await pool.query('COMMIT');
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    })().catch(e => res.send({ op: 'BARU', res: 'ERROR' }));
  }
});

router.delete('/akun', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else if (req.user.local.akses != 'master') {
    res.redirect('/');
  } else if (req.user.local.nip != req.body.nip) {
    (async () => {
      try {
        await pool.query('BEGIN');
        await pool.query('DELETE FROM akun WHERE nip=$1', [req.body.nip]);
        await pool.query('COMMIT');
        res.send({ op: 'HAPUS', res: 'SUKSES' });
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    })().catch(e => res.send({ op: 'HAPUS', res: 'ERROR' }));
  } else {
    res.send({ op: 'HAPUS', res: 'AKTIF' });
  }
});

router.get('/profile', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    config.clearArray(config.active);
    config.active.profile = "active";
    res.render('accounts/profile', {
      judul: 'PROFILE',
      nama_user: req.user.local.nama,
      active: config.active
    });
  }
});

router.get('/signin', function (req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/');
  } else {
    res.render('accounts/login2', { errorMessage: '', judul: 'Login', lte: true });
  }
});

router.post('/signin', function (req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/');
  } else {
    passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/signin'
    }, function (err, akun, info) {
      let t_ret = { errorMessage: '', nip: req.body.nip, password: req.body.password, judul: 'Login', lte: true };
      if (err) {
        t_ret.errorMessage = err.message;
        return res.render('accounts/login2', t_ret);
      }

      if (!akun) {
        t_ret.errorMessage = info.message;
        return res.render('accounts/login2', t_ret);
      }

      return req.logIn(akun, function (err) {
        if (err) {
          t_ret.errorMessage = err.message;
          return res.render('accounts/login2', t_ret);
        } else {
          return res.redirect('/');
        }
      });
    })(req, res, next);
  }
});

/*router.get('/signup', function (req, res, next) {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    res.render('accounts/signup', { errorMessage: '' });
  }
});

router.post('/signup', function (req, res, next) {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    var akun = req.body;
    var nipPromise = new ModelAkun.Akun({ nip: akun.nip }).fetch();

    return nipPromise.then(function (model) {
      if (model) {
        res.render('accounts/signup', { errorMessage: 'Username already exists' });
      } else {
        var password = akun.password;
        var hash = bcrypt.hashSync(password);

        ModelAkun.kodeGen(function (err, kode) {
          if (err) return next(err);

          var signUpAkun = new ModelAkun.Akun({
            kd: kode,
            nip: akun.nip,
            nama: akun.nama,
            password: hash
          });

          signUpAkun.save({}, { method: 'insert' }).then(function (model) {
            res.redirect(307, '/signin');
          });
        });
      }
    });
  }
});*/

router.get('/signout', function (req, res, next) {
  if (!req.isAuthenticated()) {
    res.redirect('/', { errorMessage: 'You are not logged in' });
  } else {
    req.logout();
    res.redirect('/signin');
  }
});

module.exports = router;