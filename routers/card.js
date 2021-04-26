const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const QuestionCard = require('../models/questionCard');
const AnswerCard = require('../models/answerCard');
const questionDaily = require('../models/questionDaily');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

//질문에 대해 쓰기
router.post('/', async (req, res, next) => {
	try {
		const result = await AnswerCard.create({
			contents: req.body['contents'],

		});
		res.json({ msg: 'success', result: result });
	} catch (err) {
		res.json({ msg: 'fail' });
	}
});


// 질문 랜덤 3개 받기
router.get('/daily', async (req, res) => {
	let result = { msg: 'success', dailyData: [] };
	try {
		let questionCardDatas = await QuestionCard.find({}).sort({ date: -1 }).limit(3);

		// 1. 로그인 안한 사람 -> 기본 카드 3개
		// if(!user) {
		// 	console.log("유저가 없어")
		// }

		// 처음 가입하고 처음 로그인한 사람 -> 기본카드 3개 .. dailyquestionId 검색했는데 안나온다 / dailyquestion(하루에 사용자가 받는 질문 3개) 을 만들어야 된다. 
		// 로그인 했는데 오늘 처음 요청 -> 랜덤 카드 3개 -> daily question에 넣어야 된다. 
		// 다시 들어온 사람 -> 남아있는 카드를 보여줘야 된다.

		for (questionCardData of questionCardDatas) {
			let temp = {
				cardId: questionCardData._id,
				topic: questionCardData['topic'],
				contents: questionCardData['contents'],
				createdUser: questionCardData['createdUser'],
			};
			result['dailyData'].push(temp);
		}
	} catch (err) {
		console.log(err);
		result['status'] = 'fail';
	}
	res.json(result);
});

// 질문 3개 추가
router.post('/daily', async (req, res, next) => {
	try {
		let questionCardDatas = await QuestionCard.find({}).sort({ date: -1 });
		const result = await questionDaily.create({
			//userId : req.userId,
			question1: req.body['_id'],
			question2: req.body['_id'],
			question3: req.body['_id'],
			date: moment().format("YY.MM.DD"),
		});
		res.json({ msg: 'success', result: result });
	} catch (err) {
		res.json({ msg: 'fail' });
	}
});


module.exports = router;

