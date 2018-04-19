const { Router } = require('express');
const pool = require('../db');
const router = Router();
const passport = require('passport');
const config = require('../secrets/configuration');

router.get('/', index);
router.get('/:tgl', index);

function index(req, res, next) {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {    
      try {
        let { rows } = await pool.query('SELECT b.*, k.jumlah FROM bbm b, kupon k WHERE b.kd=k.kd_bbm ORDER BY b.kd');
        let bbm = rows;
        let c_harga = [];
        let tgl = typeof req.params.tgl !== 'undefined' ? req.params.tgl : '';
        
        for (var i=0; i<bbm.length; i++) {
          let t_harga = await pool.query('SELECT * FROM harga WHERE kd_bbm=$1 AND berlaku<NOW() ORDER BY berlaku DESC LIMIT 1', [bbm[i].kd]);
          c_harga.push({
            kd: bbm[i].kd,
            nama: bbm[i].nama,
            warna_bg: bbm[i].warna_bg,
            jumlah: bbm[i].jumlah,
            harga: (t_harga.rowCount>0 ? t_harga.rows[0].harga : 0)
          });
        }

        let spbu = await pool.query(`SELECT * FROM spbu WHERE alias!=''`);
        let instansi = await pool.query('SELECT * FROM instansi');
        let jual = await pool.query(`SELECT j.*, to_char(j.tanggal, 'DD-MM-YY HH24:MI') as s_tanggal, to_char(j.dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, s.alias, s.nama as nm_spbu, i.nama as nm_instansi, a.nama as nm_akun FROM jual j, spbu s, instansi i, akun a WHERE j.kd_spbu=s.kd AND j.kd_instansi=i.dc AND j.oleh=a.kd AND to_char(j.tanggal, 'YYYY-MM-DD')=`+(tgl != '' ? `'`+tgl+`'` : `to_char(NOW(), 'YYYY-MM-DD')`));
        
        config.clearArray(config.active);
        config.active.jual = "active";
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
          bbm             : c_harga,
          jual            : jual.rows,
          tgl             : tgl,
        });
      } catch(e) {
        throw e;      
      }
    })().catch(e => { return next(e); });
  }
}

router.post('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    let jual = req.body;
    jual.det = JSON.parse(jual.det);

    (async () => {
      try {
        await pool.query('BEGIN');

        let kd = jual.kd, ret = [];
        if (jual.kd != '' && jual.okd != kd) {
          let cek_kd = await pool.query('SELECT kd FROM jual WHERE kd=$1', [kd]);
          if (cek_kd.rowCount > 0) kd = '';
        } else if (jual.kd == '' && jual.okd == '') {
          let { rows } = await pool.query('SELECT (coalesce(max(kd),0)+1) as kd FROM jual');
          kd = rows[0].kd;
        } else if (jual.kd == '' && jual.okd != '') {
          kd = jual.okd;
        }

        if (kd == '') {
          ret = { op: (jual.okd == '' ? 'BARU' : 'UBAH'), res: 'KODE'};
        } else {
          if (jual.okd == '') {
            await pool.query('INSERT INTO jual (kd, kd_spbu, kd_instansi, tanggal, liter, rupiah, bayar, dibuat, oleh) VALUES($1, $2, $3, $4, $5, $6, $7, NOW(), $8)', [kd, jual.kd_spbu, jual.kd_instansi, jual.tanggal, jual.liter, jual.rupiah, jual.bayar, req.user.local.kd]);
          } else {
            await pool.query('UPDATE jual SET kd=$1, kd_spbu=$2, kd_instansi=$3, tanggal=$4, liter=$5, rupiah=$6, bayar=$7, dibuat=NOW(), oleh=$8 WHERE kd=$9', [kd, jual.kd_spbu, jual.kd_instansi, jual.tanggal, jual.liter, jual.rupiah, jual.bayar, req.user.local.kd, jual.okd]);
          }

          let { rows } = await pool.query('SELECT (coalesce(max(kd),0)+1) as kd FROM det_jual');
          let det_kd = rows[0].kd;

          await pool.query('DELETE FROM det_jual WHERE kd_jual=$1', [kd]);

          let kupon = await pool.query('SELECT d.kd_bbm, d.jenis, MAX(d.kupon_awal+d.lembar) AS kpn_baru FROM det_jual d, jual j WHERE d.kd_jual=j.kd AND j.kd_spbu=$1 GROUP BY d.kd_bbm, d.jenis ORDER BY d.kd_bbm, d.jenis', [jual.kd_spbu]);

          let det_ins_q = 'INSERT INTO det_jual (kd, kd_jual, kd_bbm, jenis, liter, lembar, kupon_awal, rupiah, harga) VALUES';          
          for (let i=0; i<jual.det.length; i++) {
            let kpn_baru = 1;
            for (let j=0; j<kupon.rows.length; j++) {
              if (kupon.rows[j].kd_bbm == jual.det[i].kd_bbm && kupon.rows[j].jenis == jual.det[i].jenis) {
                kpn_baru = kupon.rows[j].kpn_baru;
                break;
              }
            }
            
            det_ins_q += (i > 0 ? ',' : '')+` (`+(jual.det[i].kd != '' ? jual.det[i].kd : det_kd++)+`, `+kd+`, `+jual.det[i].kd_bbm+`, `+jual.det[i].jenis+`, `+jual.det[i].liter+`, `+jual.det[i].lembar+`, `+kpn_baru+`, `+jual.det[i].rupiah+`, `+jual.det[i].harga+`)`;
          }
          det_ins_q += ';';

          await pool.query(det_ins_q);
          
          let saved = await pool.query(`SELECT j.*, to_char(j.tanggal, 'DD-MM-YY HH24:MI') as s_tanggal, to_char(j.dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, s.alias, s.nama as nm_spbu, i.nama as nm_instansi, a.nama as nm_akun FROM jual j, spbu s, instansi i, akun a WHERE j.kd_spbu=s.kd AND j.kd_instansi=i.dc AND j.oleh=a.kd AND j.kd=$1`, [kd]);
          ret = { op: (jual.okd == '' ? 'BARU' : 'UBAH'), res: 'SUKSES', data: saved.rows[0]};
        }
        
        await pool.query('COMMIT');
        res.send(ret);
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    })().catch(e => res.send({ op: (jual.okd=='' ? 'BARU' : 'UBAH'), res: 'ERROR', error: e }));
  }
});

router.get('/detail', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    pool.query('SELECT d.*, b.nama as nm_bbm FROM det_jual d, bbm b WHERE d.kd_bbm=b.kd AND d.kd_jual=$1', [req.query.kd], (err, data) => {
      if (err) return next(err);
      res.send(data.rows);
    })
  }
});

router.get('/cetak/:kd', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {    
      try {
        let jual = await pool.query(`SELECT j.*, to_char(j.tanggal, 'D Month YYYY') as s_tanggal, to_char(j.dibuat, 'DD-MM-YY HH24:MI') as s_dibuat, s.kd_pertamina, s.alias, s.nama as nm_spbu, i.nama as nm_instansi, a.nama as nm_akun FROM jual j, spbu s, instansi i, akun a WHERE j.kd_spbu=s.kd AND j.kd_instansi=i.dc AND j.oleh=a.kd AND j.kd=$1`, [req.params.kd]);

        let det_jual = await pool.query('SELECT d.*, b.nama as nm_bbm FROM det_jual d, bbm b WHERE d.kd_bbm=b.kd AND d.kd_jual=$1 ORDER BY d.kd_bbm, jenis', [req.params.kd]);

        let spbu = await pool.query(`SELECT * FROM spbu WHERE kd=$1`, [jual.rows[0].kd_spbu]);

        res.render('cetak/jual', {
          judul: 'Cetak #'+req.params.kd,
          jual: jual.rows[0],
          det_jual: det_jual.rows,
          spbu: spbu.rows[0]
        });
      } catch(e) {
        throw e;      
      }
    })().catch(e => { return next(e); });
  }
});

router.get('/kode_kupon', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    (async () => {    
      try {
        let kupon = await pool.query('SELECT d.kd_bbm, d.jenis, MAX(d.kupon_awal+d.lembar) AS kpn_baru FROM det_jual d, jual j WHERE d.kd_jual=j.kd AND j.kd_spbu=$1 GROUP BY d.kd_bbm, d.jenis ORDER BY d.kd_bbm, d.jenis', [req.query.spbu]);

        res.send(kupon.rows);
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
        await pool.query('DELETE FROM det_jual WHERE kd_jual=$1', [req.body.kd]);
        await pool.query('DELETE FROM jual WHERE kd=$1', [req.body.kd]);
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