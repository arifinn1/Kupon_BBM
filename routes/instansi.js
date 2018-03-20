const { Router } = require('express');
const pool = require('../db');
const router = Router();
const passport = require('passport');
const config = require('../secrets/configuration');

router.get('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    pool.query('SELECT * FROM instansi', (err, data) => {
      if (err) return next(err);
      config.clearArray(config.active);
      config.active.instansi = "active";
      res.render('master/instansi', {
        judul           : 'INSTANSI',
        nama_user       : req.user.local.nama,
        akses_user      : req.user.local.akses,
        active          : config.active,
        datatables      : true,
        loadingoverlay  : true,
        instansi        : data.rows
      });
    });
  }
});

router.post('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    var ins = req.body;

    // Promise
    (async () => {
      try {
        await pool.query('BEGIN');
        if (ins.odc == '') {
          let { rowCount } = await pool.query('SELECT dc FROM instansi WHERE dc=$1', [ins.dc]);
          if (rowCount == 0) {
            await pool.query('INSERT INTO instansi (dc, nama) VALUES($1, $2)', [ins.dc, ins.nama]);
            res.send({ op: 'BARU', res: 'SUKSES' });
          } else {
            res.send({ op: 'BARU', res: 'KODE' });
          }
        } else {
          if (ins.odc != ins.dc) {
            let { rowCount } = await pool.query('SELECT dc FROM instansi WHERE dc=$1', [ins.dc]);
            if (rowCount == 0) {
              await pool.query('UPDATE instansi SET dc=$1, nama=$2 WHERE dc=$3', [ins.dc, ins.nama, ins.odc]);
              res.send({ op: 'UBAH', res: 'SUKSES' });
            } else {
              res.send({ op: 'UBAH', res: 'KODE' });
            }
          } else {
            await pool.query('UPDATE instansi SET dc=$1, nama=$2 WHERE dc=$3', [ins.dc, ins.nama, ins.odc]);
            res.send({ op: 'UBAH', res: 'SUKSES' });
          }
        }
        await pool.query('COMMIT');
      } catch (e) {
        await pool.query('ROLLBACK');
        throw e;
      }
    })().catch(e => res.send({ op: 'BARU', res: 'ERROR' }));

    /* Callback
    if (ins.odc == '') {
      pool.query('SELECT dc FROM instansi WHERE dc=$1', [ins.dc], (err, data) => {
        if (data.rowCount == 0) {
          pool.query('INSERT INTO instansi (dc, nama) VALUES($1, $2)', [ins.dc, ins.nama], (err2, data2) => {
            if (err2) res.send({ op: 'BARU', res: 'ERROR' });
            res.send({ op: 'BARU', res: 'SUKSES' });
          });
        } else {
          res.send({ op: 'BARU', res: 'KODE' });
        }
      });
    } else {
      if (ins.odc != ins.dc) {
        pool.query('SELECT dc FROM instansi WHERE dc=$1', [ins.dc], (err, data) => {
          if (data.rowCount == 0) {
            pool.query('UPDATE instansi SET dc=$1, nama=$2 WHERE dc=$3', [ins.dc, ins.nama, ins.odc], (err2, data2) => {
              if (err2) res.send({ op: 'UBAH', res: 'ERROR' });
              res.send({ op: 'UBAH', res: 'SUKSES' });
            });
          } else {
            res.send({ op: 'UBAH', res: 'KODE' });
          }
        });
      } else {
        pool.query('UPDATE instansi SET dc=$1, nama=$2 WHERE dc=$3', [ins.dc, ins.nama, ins.odc], (err, data) => {
          if (err) res.send({ op: 'UBAH', res: 'ERROR' });
          res.send({ op: 'UBAH', res: 'SUKSES' });
        });
      }
    }*/
  }
});

router.delete('/', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    /*pool.query('DELETE FROM instansi WHERE dc=$1', [req.body.dc], (err, data) => {
      if (err) res.send({ op: 'HAPUS', res: 'ERROR' });
      res.send({ op: 'HAPUS', res: data.rowCount });
    });*/

    (async () => {
      try {
        await pool.query('BEGIN');
        await pool.query('DELETE FROM instansi WHERE dc=$1', [req.body.dc]);
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

router.get('/kodeGen', (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.redirect('/signin');
  } else {
    pool.query('SELECT (coalesce(max(dc),0)+1) as kode FROM instansi', (err, data) => {
      if (err) return next(err);
      var kode = String(data.rows[0].kode);
      res.send(kode);
    });
  }
});

module.exports = router;