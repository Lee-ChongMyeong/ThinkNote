const express = require('express');
const router = express.Router();
const { QuestionCard, AnswerCard, User } = require('../models');

// 토픽 보여주기 (최신 정렬 순)
router.get('/:topicName', async (req, res) => {
	try {
		let topicName = decodeURIComponent(req.params.topicName);
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const topicQuestion = await QuestionCard.aggregate([
			{
				$match: {
					topic: { $in: [`${topicName}`] }
				}
			},
			{
				$project: {
					_id: 1,
					createdUser: { $toObjectId: '$createdUser' },
					contents: 1,
					createdAt: 1
				}
			},
			{
				$lookup: {
					from: 'users',
					localField: 'createdUser',
					foreignField: '_id',
					as: 'createdUserInfo'
				}
			},
			{
				$project: {
					_id: 1,
					topic: 1,
					contents: 1,
					createdUserInfo: 1,
					createdAt: 1
				}
			},
			{ $sort: { createdAt: -1 } },
			{ $skip: page * 15 },
			{ $limit: 15 }
		]);

		const result = [];
		for (let i = 0; i < topicQuestion.length; i++) {
			let answerCount = await AnswerCard.find({ questionId: topicQuestion[i]['_id'] });
			result.push({
				questionId: topicQuestion[i]['_id'],
				contents: topicQuestion[i]['contents'],
				createdUserId: topicQuestion[i]['createdUserInfo'][0]['_id'],
				createdUserNickname: topicQuestion[i]['createdUserInfo'][0]['nickname'],
				createdUserProfileImg: topicQuestion[i]['createdUserInfo'][0]['profileImg'],
				createdAt: topicQuestion[i]['createdAt'],
				answerCount: answerCount.length
			});
		}
		return res.send({ result });
	} catch (err) {
		console.log(err);
		return res.send('fail');
	}
});

// 토픽 보여주기 (답변 많이 받은 순)
router.get('/like/:topicName', async (req, res) => {
	try {
		let topicName = decodeURIComponent(req.params.topicName);
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const topicQuestion = await QuestionCard.aggregate([
			{
				$match: {
					topic: { $in: [`${topicName}`] }
				}
			},
			{
				$project: {
					_id: { $toString: '$_id' },
					createdUser: 1,
					contents: 1,
					createdAt: 1
				}
			},
			{
				$lookup: {
					from: 'answercards',
					localField: '_id',
					foreignField: 'questionId',
					as: 'answercards'
				}
			},
			{
				$project: {
					_id: 1,
					createdUser: 1,
					topic: 1,
					contents: 1,
					answerLength: { $size: '$answercards' },
					createdAt: 1
				}
			},
			{ $sort: { answerLength: -1, createdAt: -1 } },
			{ $skip: page * 15 },
			{ $limit: 15 }
		]);

		const result = [];

		for (let i = 0; i < topicQuestion.length; i++) {
			let answerCount = await AnswerCard.find({ questionId: topicQuestion[i]['_id'] });
			let createdUserInfo = await User.findOne({ _id: topicQuestion[i]['createdUser'] });
			result.push({
				questionId: topicQuestion[i]['_id'],
				contents: topicQuestion[i]['contents'],
				createdUserId: createdUserInfo['_id'],
				createdUserNickname: createdUserInfo['nickname'],
				createdUserProfileImg: createdUserInfo['profileImg'],
				createdAt: topicQuestion[i]['createdAt'],
				answerCount: answerCount.length
			});
		}

		return res.send({ result });
	} catch (err) {
		console.log(err);
		return res.send('fail');
	}
});
module.exports = router;
