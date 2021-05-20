const express = require('express');
const router = express.Router();
const { AnswerCard, Like, Alarm } = require('../../models');
const authMiddleware = require('../../auth/authMiddleware');

// 답변카드 좋아요 클릭
router.post('/answerCard', authMiddleware, async (req, res) => {
	try {
		const { answerCardId } = req.body;
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

		const alarmSend = require('../../lib/sendAlarm');
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
			return res.send('fail');
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
		// sork so 내게시물에요서 게시물 좋아요1개,
		if (!alarmInfo) {
			return res.send({ answerCardId, likeCountNum, currentLike: false });
		}

		if (
			alarmInfo &&
			alarmInfo['userList'].length == 1 &&
			-1 != alarmInfo['userList'].indexOf(user._id)
		) {
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

// 좋아요 목록 확인
router.get('/list/:answerId', async (req, res) => {
	try {
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const { answerId } = req.params;

		const likeList = await Like.aggregate([
			{ $match: { answerId: { $eq: answerId } } },
			{
				$project: {
					_id: 1,
					userId: { $toObjectId: '$userId' }
				}
			},
			{
				$lookup: {
					from: 'users',
					localField: 'userId',
					foreignField: '_id',
					as: 'likeUserInfo'
				}
			},
			{
				$project: {
					userId: { $arrayElemAt: ['$likeUserInfo._id', 0] },
					nickname: { $arrayElemAt: ['$likeUserInfo.nickname', 0] },
					profileImg: { $arrayElemAt: ['$likeUserInfo.profileImg', 0] }
				}
			},
			{ $skip: page * 15 },
			{ $limit: 15 }
		]);
		console.log(likeList);
		return res.send({ likeList });
	} catch (err) {
		console.log(err);
		return res.send('fail');
	}
});

module.exports = router;
