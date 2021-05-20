const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const { CommentBoard, User, AnswerCard, Alarm } = require('../models');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

router.get('/', authMiddleware, async(req, res) => {
	let result = { msg: 'success', friendFeed: [] };
	try {
		
	} catch (err) {
		result['msg'] = 'fail';
	}
	res.json(result);
});

module.exports = router;