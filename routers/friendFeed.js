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
	try {
		const user = res.locals.user;
		const myFriend = await Friend.findOne({
			followingId: user.userId
		});
        console.log(myFriend);
	} catch (err) {
		result['msg'] = 'fail';
	}
	res.json(result);
});

module.exports = router;
