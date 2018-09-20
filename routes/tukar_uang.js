const { Router } = require('express');
const pool = require('../db');
const router = Router();
const passport = require('passport');
const config = require('../secrets/configuration');

router.get('/', index);
router.get('/tgl_:tgl', index);

function index(req, res, next) {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {    
      try {
        let { rows } = await pool.query('SELECT * FROM seting WHERE berlaku<NOW() ORDER BY berlaku DESC LIMIT 1');
        let c_seting = [];
        if (rows.length > 0) { c_seting = rows[0]; }

        let tgl = typeof req.params.tgl !== 'undefined' ? req.params.tgl : '';

        let que = `SELECT t.*, to_char(t.tanggal, 'DD-MM-YY HH24:MI') as s_tanggal, to_char(t.dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, j.kd_spbu, j.kd_instansi, s.alias, s.nama as nm_spbu, i.nama as nm_instansi, a.nama as nm_akun FROM tukar_uang t, jual j, spbu s, instansi i, akun a WHERE t.kd=j.kd AND j.kd_spbu=s.kd AND j.kd_instansi=i.dc AND t.oleh=a.kd AND to_char(t.tanggal, 'YYYY-MM-DD')=`+(tgl != '' ? `'`+tgl+`'` : `to_char(NOW(), 'YYYY-MM-DD')`);
        let tukar = await pool.query(que);
        
        config.clearArray(config.active);
        config.active.tukar_uang = "active";
        res.render('main/tukar_uang', {
          judul           : 'SPBU',
          nama_user       : req.user.local.nama,
          akses_user      : req.user.local.akses,
          active          : config.active,
          datatables      : true,
          loadingoverlay  : true,
          datetimepicker  : true,
          select          : true,
          tukar           : tukar.rows,
          seting          : c_seting,
          tgl             : tgl
        });
      } catch(e) {
        throw e;      
      }
    })().catch(e => { return next(e); });
  }
}

router.get('/nota_jual', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {    
      try {
        let { rows } = await pool.query(`SELECT j.kd, j.kd_spbu, j.kd_instansi, j.tanggal, to_char(j.tanggal, 'DD Month YYYY') as s_tanggal,
        s.kd_pertamina, s.alias, s.nama as nm_spbu, i.nama as nm_instansi, j.liter, j.rupiah, j.bayar,
        
        tu.tanggal as t_tanggal, to_char(tu.tanggal, 'DD Month YYYY') as st_tanggal, tu.persen, tu.reduksi,
        tu.rupiah as t_rupiah, tu.dibuat as t_dibuat, to_char(tu.dibuat, 'DD-MM-YY HH24:MI') as st_dibuat,
        tu.oleh as t_oleh, tu.nm_akun
        
        FROM jual j left join
        (select t.*, a.nama as nm_akun from tukar_uang t, akun a where t.oleh=a.kd) tu
        on (j.kd=tu.kd), spbu s, instansi i, akun a
        WHERE j.kd_spbu=s.kd AND j.kd_instansi=i.dc AND j.oleh=a.kd AND j.kd=$1`, [req.query.kd]);

        let jual = [], det_jual = [];
        if (rows.length > 0) {
          jual = rows[0];

          det_jual = await pool.query(`select b.nama, k.*, d.kd, d.max_liter, d.tukar_liter, d.s_tukar, d.harga, d.rupiah,
          
            coalesce((select h.harga from harga h where h.berlaku<=NOW() and h.kd_bbm=b.kd order by h.berlaku desc limit 1), 0)as c_harga from 
          
            (select kd_bbm, sum(liter) as liter, sum(rupiah) as rupiah, sum(lembar) as lembar, array_agg(concat(jenis,'|',lembar,'|',kupon_awal,'-', 
          
              (case when (kupon_awal+lembar-1) > 10000 then (kupon_awal+lembar-10001) else (kupon_awal+lembar-1) end)
          
            )) as kupon FROM det_jual WHERE kd_jual=$1 group by kd_bbm) as k, bbm b left join det_tukar_uang d on (b.kd=d.kd_bbm and d.kd_tukar=$1) where k.kd_bbm=b.kd`, [req.query.kd]);
          det_jual = det_jual.rows;
        }

        res.send({
          jual      : jual,
          det_jual  : det_jual
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
    let tukar = req.body;
    tukar.det = JSON.parse(tukar.det);

    (async () => {
      try {
        await pool.query('BEGIN');

        let kd = tukar.skd, ret = [];
        let { rows } = await pool.query('SELECT (coalesce(max(kd),0)+1) as kd FROM det_tukar_uang');
        let det_kd = rows[0].kd;
        
        if (tukar.okd == '') {
          await pool.query('INSERT INTO tukar_uang (kd, tanggal, persen, reduksi, rupiah, dibuat, oleh) VALUES($1, $2, $3, $4, $5, NOW(), $6)', [kd, tukar.tanggal, tukar.persen, tukar.reduksi, tukar.rupiah, req.user.local.kd]);
        } else {
          await pool.query('UPDATE tukar_uang SET tanggal=$1, persen=$2, reduksi=$3, rupiah=$4, dibuat=NOW(), oleh=$5 WHERE kd=$6', [tukar.tanggal, tukar.persen, tukar.reduksi, tukar.rupiah, req.user.local.kd, tukar.okd]);
        }

        let del = '';
        for (let i=0; i<tukar.det.length; i++) {
          if (tukar.det[i].kd != null && (tukar.det[i].rupiah == null || tukar.det[i].rupiah == 0)){
            del += (i>0 && del!='' ? ',':'')+tukar.det[i].kd;
          } else if (tukar.det[i].rupiah > 0) {
            if (tukar.det[i].kd != null) {
              await pool.query('UPDATE det_tukar_uang SET max_liter=$1, tukar_liter=$2, s_tukar=$3, harga=$4, rupiah=$5 WHERE kd=$6', [tukar.det[i].max_liter, tukar.det[i].tukar_liter, tukar.det[i].s_tukar.join(";"), tukar.det[i].harga, tukar.det[i].rupiah, tukar.det[i].kd]);
            } else {
              await pool.query('INSERT into det_tukar_uang (kd, kd_tukar, kd_bbm, liter, max_liter, tukar_liter, s_tukar, harga, rupiah) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [det_kd++, kd, tukar.det[i].kd_bbm, tukar.det[i].liter, tukar.det[i].max_liter, tukar.det[i].tukar_liter, tukar.det[i].s_tukar.join(";"), tukar.det[i].harga, tukar.det[i].rupiah]);
            }
          }
        }

        if (del!='') {
          await pool.query('DELETE FROM det_tukar_uang WHERE kd in($1)', [del]);
        }
        
        let saved = await pool.query(`SELECT t.*, to_char(t.tanggal, 'DD-MM-YY HH24:MI') as s_tanggal, to_char(t.dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, j.kd_spbu, j.kd_instansi, s.alias, s.nama as nm_spbu, i.nama as nm_instansi, a.nama as nm_akun FROM tukar_uang t, jual j, spbu s, instansi i, akun a WHERE t.kd=j.kd AND j.kd_spbu=s.kd AND j.kd_instansi=i.dc AND t.oleh=a.kd AND t.kd=$1`, [kd]);
        
        ret = { op: (tukar.okd == '' ? 'BARU' : 'UBAH'), res: 'SUKSES', data: saved.rows[0], del: del};
        
        await pool.query('COMMIT');
        res.send(ret);
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    })().catch(e => res.send({ op: (tukar.okd=='' ? 'BARU' : 'UBAH'), res: 'ERROR', error: e }));
  }
});

router.get('/cetak/:kd', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {
      try {
        let { rows } = await pool.query(`SELECT j.kd, j.kd_spbu, j.kd_instansi, j.tanggal, to_char(j.tanggal, 'DD Month YYYY') as s_tanggal,
        s.kd_pertamina, s.alias, s.nama as nm_spbu, i.nama as nm_instansi, j.liter, j.rupiah, j.bayar,
        
        tu.tanggal as t_tanggal, to_char(tu.tanggal, 'DD Month YYYY') as st_tanggal, tu.persen, tu.reduksi,
        tu.rupiah as t_rupiah, tu.dibuat as t_dibuat, to_char(tu.dibuat, 'DD-MM-YY HH24:MI') as st_dibuat,
        tu.oleh as t_oleh, tu.nm_akun
        
        FROM jual j, spbu s, instansi i, akun a,
        (select t.*, a.nama as nm_akun from tukar_uang t, akun a where t.oleh=a.kd) tu
        WHERE j.kd_spbu=s.kd AND j.kd_instansi=i.dc AND j.oleh=a.kd AND j.kd=tu.kd AND tu.kd=$1`, [req.params.kd]);

        let tukar = [], det_tukar = [], spbu = [];
        if (rows.length > 0) {
          tukar = rows[0];

          det_tukar = await pool.query(`select b.nama, k.*, d.kd, d.max_liter, d.tukar_liter, d.s_tukar, d.harga, d.rupiah,
          
            coalesce((select h.harga from harga h where h.berlaku<=NOW() and h.kd_bbm=b.kd order by h.berlaku desc limit 1), 0)as c_harga from 
          
            (select kd_bbm, sum(liter) as liter, sum(rupiah) as rupiah, sum(lembar) as lembar, array_agg(concat(jenis,'|',kupon_awal,'-', 
          
              (case when (kupon_awal+lembar-1) > 10000 then (kupon_awal+lembar-10001) else (kupon_awal+lembar-1) end)
          
            )) as kupon FROM det_jual WHERE kd_jual=$1 group by kd_bbm) as k, bbm b left join det_tukar_uang d on (b.kd=d.kd_bbm and d.kd_tukar=$1) where k.kd_bbm=b.kd and d.kd_tukar=$1`, [req.params.kd]);
          det_tukar = det_tukar.rows;

          spbu = await pool.query(`SELECT * FROM spbu WHERE kd=$1`, [tukar.kd_spbu]);
        }

        res.render('cetak/tukar_uang', {
          judul: 'Tukar Uang #'+req.params.kd,
          tukar: tukar,
          det_tukar: det_tukar,
          spbu: spbu.rows[0]
        });
      } catch(e) {
        throw e;      
      }
    })().catch(e => { return next(e); });
  }
});

router.delete('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {
      try {
        await pool.query('BEGIN');
        await pool.query('DELETE FROM det_tukar_uang WHERE kd_tukar=$1', [req.body.kd]);
        await pool.query('DELETE FROM tukar_uang WHERE kd=$1', [req.body.kd]);
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