const { Router } = require('express');
const main = require('./main');
const user = require('./user');

const router = Router();

router.use('/', main);
router.use('/', user);

module.exports = router;