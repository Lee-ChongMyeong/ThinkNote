const { QuestionCard, AnswerCard, User, Like, CommentBoard } = require('../models');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const questionInfo = require('../lib/questionInfo');
require('dotenv').config();

router.get('/cards', async (req, res) => {
	let userId = '';
	try {
		const { authorization } = req.headers;
		const [tokenType, tokenValue] = authorization.split(' ');
		if (tokenType == 'Bearer') {
			const payload = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			userId = payload.userId;
		}
	} catch (error) {
		console.log('토큰 해독 에러');
	}
	try {
		result = [];
		const randomAnswers = await AnswerCard.aggregate([
			{ $group: { _id: '$questionId', count: { $sum: 1 } } },
			{ $match: { count: { $gte: 4 } } },
			{ $sample: { size: 2 } },
			{ $project: { questionId: '$_id', count: 1, _id: 0 } }
		]);
		for (randomAnswer of randomAnswers) {
			temp = {};
			let question = await QuestionCard.findOne({ _id: randomAnswer.questionId });
			let answerData = await AnswerCard.find({ questionId: question._id, isOpen: true });
			let user = await User.findOne({ _id: question.createdUser });
			temp['questions'] = {
				questionId: question._id,
				contents: question.contents,
				topic: question.topic,
				nicname: user.nickname,
				answerCount: answerData.length
			};

			let answers = await AnswerCard.find({ questionId: question._id, isOpen: true }).limit(4);
			temp['answers'] = [];
			for (answer of answers) {
				let answerUser = await User.findOne({ _id: answer.userId });
				let commentCount = await CommentBoard.find({ cardId: answer._id });
				let like = false;
				const likeCount = await Like.find({ answerId: answer._id });
				if (userId) {
					let likeCheck = await Like.findOne({ userId: userId, answerId: answer._id });
					if (likeCheck) {
						like = true;
					}
				}
				temp['answers'].push({
					userId: answerUser._id,
					profileImg: answerUser.profileImg,
					nickname: answerUser.nickname,
					answerId: answer._id,
					contents: answer.contents,
					like: like,
					likeCount: likeCount.length,
					commentCount: commentCount.length
				});
			}
			result.push(temp);
		}
		res.json({ result: result });
	} catch (err) {
		console.log(err);
		res.status(400).json({ msg: 'fail' });
	}
});

router.get('/cards/:questionId', async (req, res) => {
	const { questionId } = req.params;
	result = await questionInfo(questionId);
	res.json({ result });
});

router.get('/cards/:questionId/test', async (req, res) => {
	const { questionId } = req.params;
	const answers = await AnswerCard.find({ questionId });
	let answerList = [];
	for (answer of answers) answerList.push(answer._id);
	let likes = await Like.find().where('answerId').in(answerList);
	countLike = {};
	for (element of likes) {
		if (!countLike[element.answerId]) countLike[element.answerId] = 1;
		else countLike[element.answerId] += 1;
	}
	mostLike = [];
	for (key in countLike) mostLike.push({ answerId: key, count: countLike[key] });
	mostLike.sort((a, b) => {
		return a.count - b.count;
	});
	res.json({ mostLike });
});

module.exports = router;
