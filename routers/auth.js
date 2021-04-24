const express = require('express');
const router = express.Router();
const passport = require('../auth/passport');

router.get('/', (req, res) => {
	res.send(`<a href='http://localhost:3000/auth/naver'>네이버 로그인</a>`);
});

// 네이버 로그인
router.get('/naver', passport.authenticate('naver', null));

// 네이버 콜백
router.get('/naver/oauth', passport.authenticate('naver', { failureRedirect: '/auth', successRedirect: 'http://naver.com' }));

module.exports = router;
