const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const { CommentBoard, User, AnswerCard, Alarm } = require('../models');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

router.get('/', authMiddleware, async (req, res) => {
	let result = { msg: 'success', friendFeed: [] };
	// eslint-disable-next-line no-empty
	try {
	} catch (err) {
		result['msg'] = 'fail';
	}
	res.json(result);
});

module.exports = router;