require('dotenv').config();
const { User } = require('../models');
const randomNickname = require('../lib/nickname');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// 구글 로그인 전략

const googleStrategy = new GoogleStrategy(
	{
		clientID: process.env.LOVE_GOOGLE_CLIENT_ID,
		clientSecret: process.env.LOVE_GOOGLE_SECRET,
		callbackURL: 'http://lkj99.shop/auth/google/oauth'
	},
	function (accessToken, refreshToken, profile, done) {
		try {
			User.findOne(
				{
					socialId: profile.id
				},
				async function (err, user) {
					if (!user) {
						let nickname = await randomNickname();
						while (true) {
							// 닉네임 중복 방지
							if (await User.findOne({ nickname: nickname }))
								nickname = await randomNickname();
							else break;
						}
						user = new User({
							nickname: nickname,
							provider: 'google',
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

module.exports = googleStrategy;
