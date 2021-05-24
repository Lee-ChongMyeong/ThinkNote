const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

module.exports = (req, res, next) => {
	try {
		const { authorization } = req.headers;
		const [tokenType, tokenValue] = authorization.split(' ');
		if (tokenType !== 'Bearer') {
			res.json({
				msg: 'TypeIncorrect'
			});
			return;
		}
		const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
		User.findById(userId)
			.exec()
			.then((user) => {
				if (user.provider === '') return res.json({ msg: 'quited user' });
				res.locals.user = user;
				next();
			});
	} catch (error) {
		res.json({
			msg: 'not_login'
		});
		return;
	}
};
