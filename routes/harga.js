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
          c_harga.push({ nama: bbm[i].nama, harga: (t_harga.rowCount>0 ? t_harga.rows[0].harga : 0) });
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

module.exports = router;