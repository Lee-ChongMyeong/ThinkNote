require('dotenv').config();
const { User } = require('../models')

const passport = require('passport');

passport.serializeUser((user, done) => {
	done(null, user.userId)
})

passport.deserializeUser((id, done) => {
	console.log(id)
	User.findOne({ userId: id }, (err, user) => {
		done(null, user);
	})
})

passport.use(require('./kakao'));
passport.use(require('./google'));
passport.use(require('./naver'));

module.exports = passport
