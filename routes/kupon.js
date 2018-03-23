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
        let c_kupon = [];
        
        for (var i=0; i<bbm.length; i++) {
          let t_kupon = await pool.query('SELECT * FROM kupon WHERE kd_bbm=$1', [bbm[i].kd]);
          c_kupon.push({ kd_bbm: bbm[i].kd, nama: bbm[i].nama, jumlah: (t_kupon.rowCount>0 ? t_kupon.rows[0].jumlah : '') });
        }

        config.clearArray(config.active);
        config.active.kupon = "active";
        res.render('master/kupon', {
          judul           : 'Kupon',
          nama_user       : req.user.local.nama,
          akses_user      : req.user.local.akses,
          active          : config.active,
          datatables      : true,
          loadingoverlay  : true,
          c_kupon         : c_kupon,
          v_kupon         : config.v_kupon
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
    var kupon = req.body;
    if (typeof kupon.jumlah !== 'undefined') {
      kupon.jumlah_j = kupon.jumlah;
      if (kupon.jumlah.constructor === Array) {
        kupon.jumlah_j = kupon.jumlah.join('-');
      } else { kupon.jumlah_j = kupon.jumlah; }
    } else { kupon.jumlah_j = ''; }
    
    (async () => {
      try {
        await pool.query('BEGIN');
        let { rowCount } = await pool.query('SELECT * FROM kupon WHERE kd_bbm=$1', [kupon.kd_bbm]);
        if (rowCount == 0) {
          await pool.query(`INSERT INTO kupon (kd_bbm, jumlah) VALUES($1, $2)`, [kupon.kd_bbm, kupon.jumlah_j]);

          let saved = await pool.query(`SELECT k.kd_bbm, b.nama, k.jumlah FROM kupon k, bbm b WHERE k.kd_bbm=b.kd AND k.kd_bbm=$1`, [kupon.kd_bbm]);

          res.send({ op: 'BARU', res: 'SUKSES', data: saved.rows[0] });
        } else {
          await pool.query(`UPDATE kupon SET jumlah=$1 WHERE kd_bbm=$2`, [kupon.jumlah_j, kupon.kd_bbm]);

          let saved = await pool.query(`SELECT k.kd_bbm, b.nama, k.jumlah FROM kupon k, bbm b WHERE k.kd_bbm=b.kd AND k.kd_bbm=$1`, [kupon.kd_bbm]);

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

module.exports = router;