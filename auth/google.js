/* eslint-disable no-constant-condition */
require('dotenv').config();
const { User } = require('../models');
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
				async (err, user) => {
					if (!user) {
						let nickname = 'new';
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
