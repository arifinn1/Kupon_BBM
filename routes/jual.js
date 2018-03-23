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
        let spbu = await pool.query('SELECT * FROM spbu');
        let instansi = await pool.query('SELECT * FROM instansi');
        let jual = await pool.query(`SELECT j.*, to_char(j.tanggal, 'DD-MM-YY HH24:MI') as s_tanggal, s.nama as nm_spbu, i.nama as nm_instansi, a.nama as nm_akun FROM jual j, spbu s, instansi i, akun a WHERE j.kd_spbu=s.kd AND j.kd_instansi=i.dc AND j.oleh=a.kd`);
        
        config.clearArray(config.active);
        config.active.spbu = "active";
        res.render('main/jual', {
          judul           : 'SPBU',
          nama_user       : req.user.local.nama,
          akses_user      : req.user.local.akses,
          active          : config.active,
          datatables      : true,
          loadingoverlay  : true,
          datetimepicker  : true,
          select          : true,
          spbu            : spbu.rows,
          instansi        : instansi.rows,
          jual            : jual.rows
        });
      } catch(e) {
        throw e;      
      }
    })().catch(e => { return next(e); });
  }
});

module.exports = router;