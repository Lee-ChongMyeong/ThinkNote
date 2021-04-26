require('dotenv').config();
const { User } = require('../models')

const passport = require('passport');

passport.serializeUser((user, done) => {
	done(null, user.userId)
})

passport.deserializeUser((id, done) => {
	console.log("deseria")
	console.log(id)
	User.findOne({ _id: id }, (err, user) => {
		console.log('하이하이')
		done(null, user);
	})
})

passport.use(require('./kakao'));
passport.use(require('./google'));
passport.use(require('./naver'));

module.exports = passport
