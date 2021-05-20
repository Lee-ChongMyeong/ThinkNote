/* eslint-disable no-unused-vars */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const {
	AnswerCard,
	User,
	QuestionCard,
	Friend,
	Like,
	CommentBoard,
	Search
} = require('../models');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

router.get('/', authMiddleware, async (req, res) => {
	let result = { msg: 'success', friendFeed: [] };
	// eslint-disable-next-line no-empty
	try {
<<<<<<< HEAD
=======
		const user = res.locals.user;
		const myFriend = await Friend.findOne({
			followingId: user.userId
		});
        console.log(myFriend);
>>>>>>> 4deeeae2e035938cb77a3844efe32903c0a50107
	} catch (err) {
		result['msg'] = 'fail';
	}
	res.json(result);
});

module.exports = router;
