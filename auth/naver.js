/* eslint-disable no-constant-condition */
require('dotenv').config();
const { User } = require('../models');
const NaverStrategy = require('passport-naver').Strategy;
// 네이버 로그인 전략

const naverStrategy = new NaverStrategy(
	{
		clientID: process.env.LOVE_NAVER_CLIENT_ID,
		clientSecret: process.env.LOVE_NAVER_SECRET,
		callbackURL: 'http://lkj99.shop/auth/naver/oauth'
	},
	function (accessToken, refreshToken, profile, done) {
		try {
			User.findOne(
				{
					socialId: profile.id
				},
				async function (err, user) {
					if (!user) {
						let nickname = 'new';
						user = new User({
							nickname: nickname,
							provider: 'naver',
							socialId: profile.id
						});
						user.save(function (err) {
							if (err) console.log(err);
							return done(err, user);
						});
					} else {
						return done(err, user);
					}
				}
			);
		} catch (err) {
			console.log(err);
			return done(err, false);
		}
	}
);

module.exports = naverStrategy;
