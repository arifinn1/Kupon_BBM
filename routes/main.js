const { Router } = require('express');
const pool = require('../db');
const router = Router();

router.get('/', (request, response, next) => {
  //res.json({ "nama": "Arifin" });
  /*pool.query('SELECT * FROM akun WHERE nip=$1', [req.akun.id], (err, res) => {
    if (err) return next(err);
    //response.json(res.rows);
  });*/
  //console.log(request.akun);

  response.redirect('/profile');
});

module.exports = router;