const { Router } = require('express');
const pool = require('../db');
const router = Router();
const passport = require('passport');
const config = require('../secrets/configuration');

router.get('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    pool.query('SELECT * FROM bbm', (err, data) => {
      if (err) return next(err);
      config.clearArray(config.active);
      config.active.bbm = "active";
      res.render('master/bbm', {
        judul           : 'BBM',
        nama_user       : req.user.local.nama,
        akses_user      : req.user.local.akses,
        active          : config.active,
        datatables      : true,
        loadingoverlay  : true,
        bbm             : data.rows,
        warna           : config.color
      });
    });
  }
});

router.post('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    var bbm = req.body;

    (async () => {
      try {
        await pool.query('BEGIN');
        if (bbm.kd == '') {
          let { rowCount } = await pool.query('SELECT nama FROM bbm WHERE nama=$1', [bbm.nama]);
          if (rowCount == 0) {
            let { rows } = await pool.query('SELECT (coalesce(max(kd),0)+1) as kd FROM bbm');

            await pool.query('INSERT INTO bbm (kd, nama, warna_bg) VALUES($1, $2, $3)', [rows[0].kd, bbm.nama, bbm.warna_bg]);
            res.send({ op: 'BARU', res: 'SUKSES', kd: rows[0].kd });
          } else {
            res.send({ op: 'BARU', res: 'NAMA' });
          }
        } else {
          let konf = 0;
          if (bbm.onama != bbm.nama) {
            let { rowCount } = await pool.query('SELECT nama FROM bbm WHERE nama=$1', [bbm.nama]);
            konf = rowCount;
          }

          if (konf == 0) {
            await pool.query(`UPDATE bbm SET nama=$1, warna_bg=$2 WHERE kd=$3`, [bbm.nama, bbm.warna_bg, bbm.kd]);
            res.send({ op: 'UBAH', res: 'SUKSES' });
          } else {
            res.send({ op: 'UBAH', res: 'NAMA' });
          }
        }
        await pool.query('COMMIT');
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }/* finally {
        pool.release();
      }*/
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
        await pool.query('DELETE FROM bbm WHERE kd=$1', [req.body.kd]);
        await pool.query('COMMIT');
        res.send({ op: 'HAPUS', res: 'SUKSES' });
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }/* finally {
        pool.release();
      }*/
    })().catch(e => res.send({ op: 'HAPUS', res: 'ERROR' }));
  }
});

module.exports = router;