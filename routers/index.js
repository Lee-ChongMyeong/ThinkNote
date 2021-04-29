const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));

router.use('/card', require('./card'));

router.use('/myPage', require('./myPage'));

router.use('/bookshelf', require('./bookshelf'));

router.use('/ourPlace', require('./ourPlace'));

router.use('/comment', require('./comment'));

module.exports = router
