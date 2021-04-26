const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const QuestionCard = require('../models/questionCard');
const AnswerCard = require('../models/answerCard');

// 질문에 대해 쓰기
router.post('/', async (req, res, next) => {
    try {
        const result = await QuestionCard.create({
			contents: req.body['contents'],
       });
       res.json({ msg : 'success', result : result });
    } catch (err) {
       res.json({ msg : 'fail' });
    }
 });

 // 질문 받기
router.get('/', async (req, res) => {
	let result = { msg : 'success', cardData : [] };
	try {
		let questionCardDatas = await QuestionCard.find({}).sort({ date: -1 });
		for (questionCardData of questionCardDatas) {
			let temp = {
                cardId : questionCardData._id,   
                topic : questionCardData['topic'],
                contents : questionCardData['contents'],
                createdUser : questionCardData['createdUser']	
			};
			result['cardData'].push(temp);
		}
	} catch (err) {
		console.log(err);
		result['status'] = 'fail';
	}
	res.json(result);
});

module.exports = router;

