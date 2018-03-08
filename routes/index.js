const { Router } = require('express');
const main = require('./main');
const akun2 = require('./akun2');

const router = Router();

router.use('/', main);
router.use('/', akun2);

module.exports = router;