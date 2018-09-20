const { Router } = require('express');
const main = require('./main');
const akun2 = require('./akun2');
const instansi = require('./instansi');
const bbm = require('./bbm');
const seting = require('./seting');
const harga = require('./harga');
const kupon = require('./kupon');
const spbu = require('./spbu');
const jual = require('./jual');
const tukar_uang = require('./tukar_uang');

const router = Router();

router.use('/', main);
router.use('/', akun2);
router.use('/instansi', instansi);
router.use('/bbm', bbm);
router.use('/seting', seting);
router.use('/harga', harga);
router.use('/kupon', kupon);
router.use('/spbu', spbu);
router.use('/jual', jual);
router.use('/tukar_uang', tukar_uang);

module.exports = router;