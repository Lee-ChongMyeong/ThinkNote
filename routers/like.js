const express = require('express');
const router = express.Router();
const { AnswerCard, QuestionCard, Like, Alarm } = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const sanitize = require('sanitize-html');

// 답변카드 좋아요 클릭
router.post('/answerCard', authMiddleware, async (req, res) => {
	try {
		const { answerCardId } = req.body;
		console.log(answerCardId);
		const user = res.locals.user;
		const currentLike = await Like.findOne({ userId: user.userId, answerId: answerCardId });
		const answer = await AnswerCard.findOne({ _id: answerCardId });
		if (currentLike) {
			return res.send('이미 좋아요 누른 상태');
		}
		// 새로고침하고 커뮤니티왔을 때 그때 좋아요가 되있는걸 취소했을 떄,
		//
		await Like.create({
			answerId: answerCardId,
			userId: user.userId
		});
		const likeCount = await Like.find({ answerId: answerCardId });
		const likeCountNum = likeCount.length;

		const alarmSend = require('../lib/sendAlarm');
		await alarmSend(answer.userId, answerCardId, 'like', user.userId, req.alarm);

		return res.send({ answerCardId, likeCountNum, currentLike: true });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

// 답변카드 좋아요 취소 클릭
router.patch('/answerCard', authMiddleware, async (req, res) => {
	try {
		const { answerCardId } = req.body;
		const user = res.locals.user;

		const currentLike = await Like.findOne({ userId: user.userId, answerId: answerCardId });
		if (!currentLike) {
			return res.send('좋아요가 안되어있는데 어떻게 좋아요를 취소합니까 아시겠어여?');
		}

		await Like.deleteOne({ answerId: answerCardId, userId: user.userId });
		let answer = await AnswerCard.findOne({ _id: answerCardId });

		const likeCount = await Like.find({ answerId: answerCardId });
		const likeCountNum = likeCount.length;

		let alarmInfo = await Alarm.findOne({
			userId: answer.userId,
			cardId: answerCardId,
			eventType: 'like'
		});
		if (alarmInfo['userList'].length == 1 && -1 != alarmInfo['userList'].indexOf(user._id)) {
			await Alarm.deleteOne({
				userId: answer.userId,
				cardId: answerCardId,
				eventType: 'like'
			});
		}
		// elif (!alarmInfo) { return }
		else {
			alarmInfo['userList'].splice(alarmInfo['userList'].indexOf(user._id), 1);
			await alarmInfo.save();
		}

		res.send({ answerCardId, likeCountNum, currentLike: false });
		return;
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

// 내 커스텀 카드 질문조회(답변 많은 순)
router.get('/question', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const myCustomQuestionCard = await QuestionCard.aggregate([
			{ $match: { createdUser: { $eq: user.userId } } },
			{ $project: { _id: { $toString: '$_id' }, topic: 1, contents: 1, createdUser: 1 } },
			{
				$lookup: {
					from: 'answercards',
					localField: '_id',
					foreignField: 'questionId',
					as: 'answercards'
				}
			},
			{ $sort: { answercards: -1 } },
			{ $skip: page * 15 },
			{ $limit: 15 },
			{
				$project: {
					_id: 1,
					contents: 1,
					createdUser: 1,
					answerLength: { $size: '$answercards' }
				}
			}
		]);

		let result = [];
		for (let i = 0; i < myCustomQuestionCard.length; i++) {
			result.push({
				questionId: myCustomQuestionCard[i]['_id'],
				questionContents: sanitize(myCustomQuestionCard[i]['contents']),
				questionTopic: myCustomQuestionCard[i]['topic'],
				questionCreatedAt: myCustomQuestionCard[i]['createdAt'],
				answerCount: myCustomQuestionCard[i]['answerLength']
			});
		}
		return res.send({
			result: result
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
