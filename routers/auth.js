const express = require('express');
const router = express.Router();
const passport = require('../auth/passport');

router.get('/', (req, res) => {
	res.send(`<a href='http://lkj99.shop/auth/naver'>네이버 로그인</a> <a href='http://lkj99.shop/auth/google'>구글 로그인</a> <a href='http://lkj99.shop/auth/kakao'> 카카오 로그인 </a>`);
});

router.use('/user', require('./authUser'))

// 네이버 로그인
router.get('/naver', passport.authenticate('naver', null));

// 카카오 로그인
router.get('/kakao', passport.authenticate('kakao', null));

// 구글 로그인
router.get('/google', passport.authenticate('google', { scope: ["profile"] }));

// 네이버 콜백
router.get('/naver/oauth', passport.authenticate('naver', { failureRedirect: '/auth', successRedirect: 'http://localhost:3000/' },));

// 카카오 콜백
router.get('/kakao/oauth', passport.authenticate('kakao', { failureRedirect: '/auth', successRedirect: 'http://localhost:3000/' }));

// 구글 콜백
router.get('/google/oauth', passport.authenticate('google', { failureRedirect: '/auth' }), (req, res) => {
	res.send('하이하이')
});

module.exports = router;