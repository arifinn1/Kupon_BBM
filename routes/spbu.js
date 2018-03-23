const { Router } = require('express');
const pool = require('../db');
const router = Router();
const passport = require('passport');
const config = require('../secrets/configuration');

router.get('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    pool.query('SELECT * FROM spbu', (err, data) => {
      if (err) return next(err);
      config.clearArray(config.active);
      config.active.spbu = "active";
      res.render('master/spbu', {
        judul           : 'SPBU',
        nama_user       : req.user.local.nama,
        akses_user      : req.user.local.akses,
        active          : config.active,
        datatables      : true,
        loadingoverlay  : true,
        spbu            : data.rows
      });
    });
  }
});

router.post('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    let spbu = req.body;

    (async () => {
      try {
        await pool.query('BEGIN');
        if (spbu.okd_pertamina == '') {
          let { rowCount } = await pool.query('SELECT kd_pertamina FROM spbu WHERE kd_pertamina=$1', [spbu.kd_pertamina]);
          if (rowCount == 0) {
            let { rows } = await pool.query('SELECT (coalesce(max(kd),0)+1) as kd FROM spbu');
            await pool.query('INSERT INTO spbu (kd, kd_pertamina, nama, alamat, email, telp) VALUES($1, $2, $3, $4, $5, $6)', [rows[0].kd, spbu.kd_pertamina, spbu.nama, spbu.alamat, spbu.email, spbu.telp]);

            spbu.kd = rows[0].kd;
            res.send({ op: 'BARU', res: 'SUKSES', data: spbu });
          } else {
            res.send({ op: 'BARU', res: 'KODE' });
          }
        } else {
          if (spbu.okd_pertamina != spbu.kd_pertamina) {
            let { rowCount } = await pool.query('SELECT kd_pertamina FROM spbu WHERE kd_pertamina=$1', [spbu.kd_pertamina]);
            if (rowCount == 0) {
              await pool.query('UPDATE spbu SET kd_pertamina=$1, nama=$2, alamat=$3, email=$4, telp=$5 WHERE kd=$6', [spbu.kd_pertamina, spbu.nama, spbu.alamat, spbu.email, spbu.telp, spbu.kd]);

              res.send({ op: 'UBAH', res: 'SUKSES', data: spbu });
            } else {
              res.send({ op: 'UBAH', res: 'KODE' });
            }
          } else {
            await pool.query('UPDATE spbu SET nama=$1, alamat=$2, email=$3, telp=$4 WHERE kd=$5', [spbu.nama, spbu.alamat, spbu.email, spbu.telp, spbu.kd]);
            res.send({ op: 'UBAH', res: 'SUKSES', data: spbu });
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

router.delete('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {
      try {
        await pool.query('BEGIN');
        await pool.query('DELETE FROM spbu WHERE kd=$1', [req.body.kd]);
        await pool.query('COMMIT');
        res.send({ op: 'HAPUS', res: 'SUKSES' });
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    })().catch(e => res.send({ op: 'HAPUS', res: 'ERROR' }));
  }
});

module.exports = router;