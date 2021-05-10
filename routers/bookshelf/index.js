const express = require('express');
const router = express.Router();

router.use('/like', require('./like'));
router.use('/moreInfocard', require('./moreInfoCard'));
router.use('/other', require('./other'));
router.use('/', require('./bookshelf'));

module.exports = router;
