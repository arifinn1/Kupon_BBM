const { Router } = require('express');
const pool = require('../db');
const router = Router();
const passport = require('passport');
const config = require('../secrets/configuration');

router.get('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {    
      try {
        let { rows } = await pool.query('SELECT * FROM bbm');
        let bbm = rows;
        let c_harga = [];
        
        for (var i=0; i<bbm.length; i++) {
          let t_harga = await pool.query('SELECT * FROM harga WHERE kd_bbm=$1 AND berlaku<NOW() ORDER BY berlaku DESC LIMIT 1', [bbm[i].kd]);
          c_harga.push({ kd: bbm[i].kd, nama: bbm[i].nama, warna_bg: bbm[i].warna_bg, harga: (t_harga.rowCount>0 ? t_harga.rows[0].harga : 0) });
        }
        
        let harga = await pool.query(`SELECT h.*, to_char(berlaku, 'DD-MM-YY HH24:MI') as s_berlaku, to_char(dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, b.nama as nm_bbm, a.nama as nm_oleh FROM harga h, akun a, bbm b WHERE h.kd_bbm=b.kd AND h.oleh=a.kd`);
        
        config.clearArray(config.active);
        config.active.harga = "active";
        res.render('master/harga', {
          judul           : 'Harga',
          nama_user       : req.user.local.nama,
          akses_user      : req.user.local.akses,
          active          : config.active,
          datatables      : true,
          loadingoverlay  : true,
          datetimepicker  : true,
          c_harga         : c_harga,
          harga           : harga.rows
        });
      } catch(e) {
        throw e;      
      }
    })().catch(e => { return next(e); });
  }
});

router.post('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    var harga = req.body;

    (async () => {
      try {
        await pool.query('BEGIN');
        if (harga.kd == '') {
          let { rows } = await pool.query('SELECT (coalesce(max(kd),0)+1) as kd FROM harga');
          await pool.query('INSERT INTO harga (kd, kd_bbm, berlaku, harga, dibuat, oleh) VALUES($1, $2, $3, $4, NOW(), $5)', [rows[0].kd, harga.kd_bbm, harga.berlaku, harga.harga, req.user.local.kd]);

          let saved = await pool.query(`SELECT h.*, to_char(berlaku, 'DD-MM-YY HH24:MI') as s_berlaku, to_char(dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, b.nama as nm_bbm, a.nama as nm_oleh FROM harga h, akun a, bbm b WHERE h.kd_bbm=b.kd AND h.oleh=a.kd and h.kd=$1`, [rows[0].kd]);

          res.send({ op: 'BARU', res: 'SUKSES', data: saved.rows[0] });
        } else {
          await pool.query('UPDATE harga set kd_bbm=$1, berlaku=$2, harga=$3, dibuat=NOW(), oleh=$4 WHERE kd=$5', [harga.kd_bbm, harga.berlaku, harga.harga, req.user.local.kd, harga.kd]);

          let saved = await pool.query(`SELECT h.*, to_char(berlaku, 'DD-MM-YY HH24:MI') as s_berlaku, to_char(dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, b.nama as nm_bbm, a.nama as nm_oleh FROM harga h, akun a, bbm b WHERE h.kd_bbm=b.kd AND h.oleh=a.kd and h.kd=$1`, [harga.kd]);

          res.send({ op: 'UBAH', res: 'SUKSES', data: saved.rows[0] });
        }
        await pool.query('COMMIT');
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    })().catch(e => res.send({ op: (harga.kd=='' ? 'BARU' : 'UBAH'), res: 'ERROR' }));
  }
});

router.delete('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {
      try {
        await pool.query('BEGIN');
        await pool.query('DELETE FROM harga WHERE kd=$1', [req.body.kd]);
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