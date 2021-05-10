const express = require('express');
const router = express.Router();
const { QuestionCard } = require('../models');
require('dotenv').config();

//어드민 질문 받아오기
router.get(`/${process.env.LOVE_SERVICEINFO_QUESTIONLIST}`, async (req, res) => {
	const questionList = await QuestionCard.find({ createdUser: '608971a172444320da6e8671' });
	const adminQuestion = [];
	for (let i = 0; i < questionList.length; i++) {
		const topic = questionList[i]['topic'];
		const contents = questionList[i]['contents'];
		adminQuestion.push(topic + '#' + contents);
		console.log(topic + '#' + contents);
	}
	return res.send(adminQuestion);
});

// 답변 많은순 질문 받아오기
router.get(`/test`, async (req, res) => {
	try {
		const popularQuestionList = await QuestionCard.aggregate([
			{ $project: { _id: { $toString: '$_id' }, topic: 1, contents: 1, createdUser: 1 } },
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
					contents: 1,
					createdUser: 1,
					answerLength: { $size: '$answercards' }
				}
			},
			{ $sort: { answerLength: -1 } },
			{ $limit: 30 }
		]);

		let result = [];
		for (let popularQuestion of popularQuestionList) {
			result.push({
				questionId: popularQuestion._id,
				quesitonContents: popularQuestion.contents,
				questionTopic: popularQuestion.topic,
				answerCount: popularQuestion.answerLength
			});
		}

		return res.json({ result: result });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
