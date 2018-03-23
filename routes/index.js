const { Router } = require('express');
const main = require('./main');
const akun2 = require('./akun2');
const instansi = require('./instansi');
const bbm = require('./bbm');
const harga = require('./harga');
const kupon = require('./kupon');
const spbu = require('./spbu');

const router = Router();

router.use('/', main);
router.use('/', akun2);
router.use('/instansi', instansi);
router.use('/bbm', bbm);
router.use('/kupon', kupon);
router.use('/spbu', spbu);

module.exports = router;