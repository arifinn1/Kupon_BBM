const { Router } = require('express');
const pool = require('../db');
const router = Router();

router.get('/', (request, response, next) => {
  //res.json({ "nama": "Arifin" });
  pool.query('SELECT * FROM test', (err, res) => {
    if (err) return next(err);
    response.json(res.rows);
  });
});

module.exports = router;