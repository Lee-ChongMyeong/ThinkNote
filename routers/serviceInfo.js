const express = require('express');
const router = express.Router();
const {
	AnswerCard,
	User,
	QuestionCard,
	Friend,
	Like,
	Alarm,
	CommentBoard,
	Search
} = require('../models');
require('dotenv').config();

//어드민 질문 받아오기
router.get(`/${process.env.LOVE_SERVICEINFO_QUESTIONLIST}`, async (req, res) => {
	const questionList = await QuestionCard.find({ createdUser: '608971a172444320da6e8671' });
	adminQuestion = [];
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
	// const adminId = '608971a172444320da6e8671'
	// const questionList = await QuestionCard.find({ userId: "608971a172444320da6e8671" })
	const popularQuestionList = await QuestionCard.aggregate([
		{ $project: { _id: { $toString: '$_id' } } },
		{ $limit: 30 }
	]);

	let adminQuestion = [];
	for (questionListData of questionList) {
		const answerList = await AnswerCard.find({ questionId: questionListData._id });
		let answerListCount = answerList.length;

		adminQuestion.push({
			questionId: questionListData._id
		});

		return res.json(adminQuestion);
	}

	res.json({ questionlist });
});

module.exports = router;
