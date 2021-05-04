const express = require('express');
const router = express.Router();
const sanitize = require('sanitize-html');
const { CommentBoard, User, AnswerCard, Alarm } = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

// 댓글 리스트
router.get('/:cardId', async (req, res, next) => {
	const cardId = req.params.cardId;
	let result = { msg: 'success', comments: [] };
	try {
		//const comments = await CommentBoard.find({ cardId: cardId }).populate({path:"user"});
		const comments = await CommentBoard.find({ cardId: cardId }).sort({ date: -1 });
		for (comment of comments) {
			const userInfo = await User.findOne({ _id: comment.userId });
			let temp = {
				commentId: comment.commentId,
				commentContents: sanitize(comment.commentContents),
				tag: comment.tag,
				userId: comment.userId,
				nickname: userInfo.nickname,
				profileImg: userInfo['profileImg']
				// alert(JSON.stringify(myObj))
			};
			result['comments'].push(temp);
		}
	} catch (err) {
		result['msg'] = 'fail';
	}
	res.json(result);
});

// 댓글 입력
router.post('/:cardId', authMiddleware, async (req, res, next) => {
	const cardId = req.params.cardId;
	const { tag } = req.body;
	const user = res.locals.user;
	console.log(tag)
	const { userId } = await AnswerCard.findOne({ _id: cardId });
	console.log('==하이==')

	try {
		let result = {
			cardId: cardId,
			commentContents: sanitize(req.body.commentContents),
			userId: sanitize(user.id),
			tag: tag
		};

		let comment = await CommentBoard.create(result);
		(result['nickname'] = user.nickname), (result['profileImg'] = user.profileImg);
		result['commnetId'] = comment._id;
		res.json({ msg: 'success', result: result });

		const alarmSend = require('../lib/sendAlarm');
		// 태그 있을때
		if (tag) {
			for (let i = 0; i < tag.length; i++) {
				await alarmSend(tag[i][1], cardId, 'tag', user.userId, req.alarm)
			}
		}
		await alarmSend(userId, cardId, 'comment', user.userId, req.alarm);
	} catch (err) {
		console.log(err);
		res.json({ msg: 'fail' });
	}
});

// 댓글 삭제
router.delete('/:commentId', authMiddleware, async (req, res, next) => {
	let result = { msg: 'success' };
	try {
		console.log(1);
		const user = res.locals.user;
		const commentId = req.params.commentId;
		const commentData = await CommentBoard.findOne({ _id: commentId, userId: user.id });
		console.log(commentData)
		const answerCardData = await AnswerCard.findOne({ _id: commentData.cardId });
		const userId = answerCardData.userId;
		const answerId = answerCardData._id;

		const { deletedCount } = await CommentBoard.deleteOne({ _id: commentId, userId: user.id });
		if (!deletedCount) result['msg'] = 'fail';

		let isComment = await CommentBoard.findOne({ cardId: answerId, userId: user.id });
		let alarmInfo = await Alarm.findOne({ userId: userId, cardId: commentData.cardId, eventType: 'comment' });
		if (!isComment) {
			if (-1 != alarmInfo['userList'].indexOf(user._id)) {
				alarmInfo['userList'].splice(alarmInfo['userList'].indexOf(user._id), 1);
				await alarmInfo.save();
			}
			if (alarmInfo['userList'].length == 0) await Alarm.deleteOne({ userId: userId, cardId: commentData.cardId, eventType: 'comment' });
		}
	} catch (err) {
		console.log(err);
		result['msg'] = 'fail';
	}
	res.json(result);
});

module.exports = router;
