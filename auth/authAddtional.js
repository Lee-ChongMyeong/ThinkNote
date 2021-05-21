const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

module.exports = (req, res, next) => {
	try {
		const { authorization } = req.headers;
		const [tokenType, tokenValue] = authorization.split(' ');
		if (tokenType !== 'Bearer') {
			next();
		}
		const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
		User.findById(userId)
			.exec()
			.then((user) => {
				res.locals.user = user;
				next();
			});
	} catch (error) {
		next();
	}
};
