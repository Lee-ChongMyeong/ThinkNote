/* eslint-disable no-unused-vars */
const express = require('express');
const router = express.Router();
// eslint-disable-next-line no-undef
const sanitize = require('../lib/sanitizeHtml');
const { CommentBoard, User, AnswerCard, Alarm, CommentLike } = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

// 댓글 리스트
router.get('/:cardId', async (req, res) => {
	const cardId = req.params.cardId;
	let result = { msg: 'success', comments: [] };
	try {
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const comments = await CommentBoard.find({ cardId: cardId })
			.sort('createdAt')
			.skip(page * 15)
			.limit(15);
		for (let comment of comments) {
			const userInfo = await User.findOne({ _id: comment.userId });
			let temp = {
				commentId: comment.commentId,
				commentContents: sanitize(comment.commentContents),
				tag: comment.tag,
				userId: comment.userId,
				nickname: sanitize(userInfo.nickname),
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
			commentContents: sanitize(req.body.commentContents),
			userId: sanitize(user.id),
			tag: tag,
			commentCreatedAt: moment().format('YYYY-MM-DDT+'),
			date: Date.now()
		};

		let comment = await CommentBoard.create(result);
		(result['nickname'] = user.nickname), (result['profileImg'] = user.profileImg);
		result['commentId'] = comment._id;
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

// 댓글 좋아요 클릭
router.post('/like/:commentId', authMiddleware, async (req, res) => {
	try {
		const commentId = req.params.commentId;
		const user = res.locals.user;

		const currentLike = await CommentLike.findOne({
			userId: user.userId,
			commentId: commentId
		});
		const answer = await CommentBoard.findOne({ _id: commentId });
		if (currentLike) {
			return res.send('좋아요 누른 상태');
		}
		await CommentLike.create({
			commentId: commentId,
			userId: user.userId
		});
		const likeCount = await CommentLike.find({ commentId: commentId });
		const likeCountNum = likeCount.length;

		const alarmSend = require('../lib/sendAlarm');
		await alarmSend(answer.userId, commentId, 'commentLike', user.userId, req.alarm);

		return res.send({ commentId, likeCountNum, currentLike: true });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

// 답변카드 좋아요 취소 클릭
router.patch('/like/:commentId', authMiddleware, async (req, res) => {
	try {
		const commentId = req.params.commentId;
		const user = res.locals.user;

		const currentLike = await CommentLike.findOne({
			userId: user.userId,
			commentId: commentId
		});
		if (!currentLike) {
			return res.send('좋아요 취소 상태');
		}

		await CommentLike.deleteOne({ commentId: commentId, userId: user.userId });
		let answer = await CommentBoard.findOne({ _id: commentId });

		const likeCount = await CommentLike.find({ commentId: commentId });
		const likeCountNum = likeCount.length;

		let alarmInfo = await Alarm.findOne({
			userId: answer.userId,
			commentId: commentId,
			eventType: 'commentLike'
		});
		//sork so 내게시물에요서 게시물 좋아요1개,
		if (!alarmInfo) {
			return res.send({ commentId, likeCountNum, currentLike: false });
		}

		if (
			alarmInfo &&
			alarmInfo['userList'].length == 1 &&
			-1 != alarmInfo['userList'].indexOf(user._id)
		) {
			await Alarm.deleteOne({
				userId: answer.userId,
				cardId: commentId,
				eventType: 'commentLike'
			});
		}
		// elif (!alarmInfo) { return }
		else {
			alarmInfo['userList'].splice(alarmInfo['userList'].indexOf(user._id), 1);
			await alarmInfo.save();
		}

		res.send({ commentId, likeCountNum, currentLike: false });
		return;
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
