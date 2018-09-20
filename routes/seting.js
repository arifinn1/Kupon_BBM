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
        let { rows } = await pool.query('SELECT * FROM seting WHERE berlaku<NOW() ORDER BY berlaku DESC LIMIT 1');
        let c_seting = [];
        if (rows.length > 0) { c_seting = rows[0]; }
        
        let seting = await pool.query(`SELECT s.*, to_char(s.berlaku, 'DD-MM-YY HH24:MI') as s_berlaku, to_char(s.dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, a.nama as nm_oleh FROM seting s, akun a WHERE s.oleh=a.kd`);
        
        config.clearArray(config.active);
        config.active.seting = "active";
        res.render('master/seting', {
          judul           : 'Seting',
          nama_user       : req.user.local.nama,
          akses_user      : req.user.local.akses,
          active          : config.active,
          datatables      : true,
          loadingoverlay  : true,
          datetimepicker  : true,
          c_seting        : c_seting,
          seting          : seting.rows
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
    var seting = req.body;

    (async () => {
      try {
        await pool.query('BEGIN');
        if (seting.kd == '') {
          let { rows } = await pool.query('SELECT (coalesce(max(kd),0)+1) as kd FROM seting');
          await pool.query('INSERT INTO seting (kd, exp_bulan, exp_kupon, persen, reduksi, berlaku, dibuat, oleh) VALUES($1, $2, $3, $4, $5, $6, NOW(), $7)', [rows[0].kd, seting.exp_bulan, seting.exp_kupon, seting.persen, seting.reduksi, seting.berlaku, req.user.local.kd]);

          let saved = await pool.query(`SELECT s.*, to_char(s.berlaku, 'DD-MM-YY HH24:MI') as s_berlaku, to_char(s.dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, a.nama as nm_oleh FROM seting s, akun a WHERE s.oleh=a.kd and s.kd=$1`, [rows[0].kd]);

          res.send({ op: 'BARU', res: 'SUKSES', data: saved.rows[0] });
        } else {
          await pool.query('UPDATE seting set exp_bulan=$1, exp_kupon=$2, persen=$3, reduksi=$4, berlaku=$5, dibuat=NOW(), oleh=$6 WHERE kd=$7', [seting.exp_bulan, seting.exp_kupon, seting.persen, seting.reduksi, seting.berlaku, req.user.local.kd, seting.kd]);

          let saved = await pool.query(`SELECT s.*, to_char(s.berlaku, 'DD-MM-YY HH24:MI') as s_berlaku, to_char(s.dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, a.nama as nm_oleh FROM seting s, akun a WHERE s.oleh=a.kd and s.kd=$1`, [seting.kd]);

          res.send({ op: 'UBAH', res: 'SUKSES', data: saved.rows[0] });
        }
        await pool.query('COMMIT');
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    })().catch(e => res.send({ op: (seting.kd=='' ? 'BARU' : 'UBAH'), res: 'ERROR' }));
  }
});

router.delete('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {
      try {
        await pool.query('BEGIN');
        await pool.query('DELETE FROM seting WHERE kd=$1', [req.body.kd]);
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