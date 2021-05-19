const express = require('express');
const router = express.Router();
// eslint-disable-next-line no-undef
const sanitize = require('sanitize-html');
const { CommentBoard, User, AnswerCard, Alarm } = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');
const sanitizedDescription = sanitize({ allowedTags: ['<', '>'] });

// 댓글 리스트
router.get('/:cardId', async (req, res) => {
	const cardId = req.params.cardId;
	let result = { msg: 'success', comments: [] };
	try {
		const comments = await CommentBoard.find({ cardId: cardId }).sort('-createdAt');
		for (let comment of comments) {
			const userInfo = await User.findOne({ _id: comment.userId });
			let temp = {
				commentId: comment.commentId,
				commentContents: sanitize(comment.commentContents),
				tag: comment.tag,
				userId: comment.userId,
				nickname: userInfo.nickname,
				profileImg: userInfo['profileImg'],
				commentCreatedAt: moment(comment.createdAt).add(9, 'hours')
			};
			result['comments'].push(temp);
		}
	} catch (err) {
		result['msg'] = 'fail';
	}
	res.json(result);
});

// 댓글 입력
router.post('/:cardId', authMiddleware, async (req, res) => {
	const cardId = req.params.cardId;
	const { tag } = req.body;
	const user = res.locals.user;
	const { userId } = await AnswerCard.findOne({ _id: cardId });

	try {
		if (req.body.commentContents <= 100) {
			return res.status(400).json({ msg: 'check comment length' });
		}
		let result = {
			cardId: cardId,
			commentContents: sanitizedDescription(req.body.commentContents),
			userId: sanitize(user.id),
			tag: tag,
			commentCreatedAt: moment().format('YYYY-MM-DDT+'),
			date: Date.now()
		};

		let comment = await CommentBoard.create(result);
		(result['nickname'] = user.nickname), (result['profileImg'] = user.profileImg);
		result['commnetId'] = comment._id;
		res.json({ msg: 'success', result: result });

		const alarmSend = require('../lib/sendAlarm');
		// 태그 있을때
		if (tag) {
			for (let i = 0; i < tag.length; i++) {
				await alarmSend(tag[i][1], cardId, 'tag', user.userId, req.alarm);
			}
		}
		await alarmSend(userId, cardId, 'comment', user.userId, req.alarm);
	} catch (err) {
		console.log(err);
		res.json({ msg: 'fail' });
	}
});

// 댓글 삭제
router.delete('/:commentId', authMiddleware, async (req, res) => {
	let result = { msg: 'success' };
	try {
		const user = res.locals.user;
		const commentId = req.params.commentId;
		const commentData = await CommentBoard.findOne({ _id: commentId, userId: user.id });
		const answerCardData = await AnswerCard.findOne({ _id: commentData.cardId });
		const userId = answerCardData.userId;
		const answerId = answerCardData._id;

		const { deletedCount } = await CommentBoard.deleteOne({ _id: commentId, userId: user.id });
		if (!deletedCount) result['msg'] = 'fail';

		let isComment = await CommentBoard.findOne({ cardId: answerId, userId: user.id });
		let alarmInfo = await Alarm.findOne({
			userId: userId,
			cardId: commentData.cardId,
			eventType: 'comment'
		});
		if (!isComment) {
			if (-1 != alarmInfo['userList'].indexOf(user._id)) {
				alarmInfo['userList'].splice(alarmInfo['userList'].indexOf(user._id), 1);
				await alarmInfo.save();
			}
			if (alarmInfo['userList'].length == 0)
				await Alarm.deleteOne({
					userId: userId,
					cardId: commentData.cardId,
					eventType: 'comment'
				});
		}
	} catch (err) {
		console.log(err);
		result['msg'] = 'fail';
	}
	res.json(result);
});

module.exports = router;
