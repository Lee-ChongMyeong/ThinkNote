const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));

router.use('/card', require('./card'));

router.use('/myPage', require('./myPage'));

router.use('/bookshelf', require('./bookshelf'));

router.use('/ourPlace', require('./ourPlace'));

router.use('/comment', require('./comment'));

router.use('/serviceInfo', require('./serviceInfo'));

router.use('/friendFeed', require('./friendFeed'));

<<<<<<< HEAD
// router.use('/topic', require('./topic'));
=======
router.use('/topic', require('./topic'));
>>>>>>> 4deeeae2e035938cb77a3844efe32903c0a50107

module.exports = router;
