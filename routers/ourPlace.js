/* eslint-disable no-undef */
const { QuestionCard, AnswerCard, User, Like, CommentBoard } = require('../models');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const questionInfo = require('../lib/questionInfo');
require('dotenv').config();
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');
Sanitize.clean(CGI.unescapeHTML(your_string));
const sanitize = require('sanitize-html');

// 랜덤으로 질문에 답글이 하나 이상 달린 글 출력
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
		console.log(error);
		console.log('토큰 해독 에러 또는 토큰 없음');
	}
	try {
		const result = [];
		const randomAnswers = await AnswerCard.aggregate([
			{ $match: { isOpen: { $eq: true } } },
			{ $group: { _id: '$questionId', count: { $sum: 1 } } },
			{ $match: { count: { $gte: 2 } } },
			{ $sample: { size: 2 } },
			{ $project: { questionId: '$_id', count: 1, _id: 0 } }
		]);
		for (let randomAnswer of randomAnswers) {
			const temp = {};
			console.log(randomAnswer.questionId);
			let question = await QuestionCard.findOne({ _id: randomAnswer.questionId });
			console.log(question);
			let [answerData, user] = await Promise.all([
				AnswerCard.find({ questionId: question._id, isOpen: true }),
				User.findOne({ _id: question.createdUser })
			]);
			temp['questions'] = {
				questionId: question._id,
				contents: sanitize(question.contents),
				topic: question.topic,
				nicname: sanitize(user.nickname),
				answerCount: answerData.length
			};

			// 자신을 제외한 공개된 답변들만 출력
			let answers = await AnswerCard.find({ questionId: question._id, isOpen: true }).limit(
				4
			);
			temp['answers'] = await Promise.all(
				answers.map(async (answer) => {
					let [answerUser, commentCount, likeCount] = await Promise.all([
						User.findOne({ _id: answer.userId }),
						CommentBoard.find({ cardId: answer._id }),
						Like.find({ answerId: answer._id })
					]);
					let like = false;
					if (userId) {
						let likeCheck = await Like.findOne({
							userId: userId,
							answerId: answer._id
						});
						if (likeCheck) {
							like = true;
						}
					}
					return {
						userId: answerUser._id,
						profileImg: answerUser.profileImg,
						nickname: sanitize(answerUser.nickname),
						answerId: answer._id,
						contents: sanitize(answer.contents),
						like: like,
						likeCount: likeCount.length,
						commentCount: commentCount.length,
						answerCreated: answer.YYMMDD
					};
				})
			);

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
	const result = await questionInfo(questionId);
	res.json({ result });
});

module.exports = router;
