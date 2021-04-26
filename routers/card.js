const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const QuestionCard = require('../models/questionCard');
const AnswerCard = require('../models/answerCard');
const questionDaily = require('../models/questionDaily');
const authMiddleware = require('../auth/authMiddleware')
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

//질문에 대해 쓰기
router.post('/', authMiddleware, async (req, res, next) => {
	user = res.locals.user;
	console.log(user)
    try {
        const result = await AnswerCard.create({
			questionId : req.body['questionId'],
			contents: req.body['contents'],
			createdUser : user._id,
			YYMMDD : moment().format("YYMMDD"),
			
       });
       res.json({ msg : 'success', result : result });
    } catch (err) {
       res.json({ msg : 'fail' });
    }
 });


// 질문 랜덤 3개 받기
router.get('/daily', async (req, res) => {
	let result = { msg : 'success', dailyData : [] };
	try {		

		//// 1. 로그인 안한 사람 -> 기본 카드 3개

		// if(!req.user) {
		// 	let dailyData = [
		// 	const temp1 = {
		// 	topic : "사랑",
		// 	contents : "가족이먼저? 여자친구가",
		//  	createdUser : "",
		//  	},

		// 	const temp2 = 
		// 	{
		//  	topic : "우정",
		// 	contents : "진정한 친구란?",
		//  	createdUser : "초코상균",
		//  	},
			 
		// 	const temp3 = 
		// 	{
		//  	topic : "정치",
		// 	contents : "오세훈 과연 잘하고 있는가?",
		//  	createdUser : "총맹이",
		//  	}

		//  	};
		// 	result['dailyData'].push(temp1);
		// 	result['dailyData'].push(temp2);
		// 	result['dailyData'].push(temp3);
		// }

		

		//// 2. 처음 가입하고 처음 로그인한 사람 -> 기본카드 3개 .. dailyquestionId 검색했는데 안나온다 / dailyquestion(하루에 사용자가 받는 질문 3개) 을 만들어야 된다. 


		//// 3. 로그인 했는데 오늘 처음 요청 -> 랜덤 카드 3개 -> daily question에 넣어야 된다. 
		let questionCardDatas = await QuestionCard.find({}).sort({ date: -1 }).limit(3);
		let questionDailyDatas = await questionDaily.find({}).sort({date : -1});
		
		for (questionCardData of questionCardDatas) {
			let temp = {
				cardId : questionCardData._id,   
                topic : questionCardData['topic'],
                contents : questionCardData['contents'],
                createdUser : questionCardData['createdUser'],
			};


			result['dailyData'].push(temp);
		}	
			
		
		//// 4.  다시 들어온 사람 -> 남아있는 카드를 보여줘야 된다.
	

		
	} catch (err) {
		console.log(err);
		result['status'] = 'fail';
	}
	res.json(result);
});

// Daily 질문 대답했을 때
router.post('/daily', authMiddleware, async (req, res, next) => {
    try {
	//	let questionCardDatas = await QuestionCard.find({}).sort({ date: -1 });
        const result = await questionDaily.create({
			//userId : req.userId,
			question1 : req.body['cardId'],
			question2 : req.body['cardId'],
			question3 : req.body['cardId'],
			date : moment().format("YY.MM.DD"),
       });
       res.json({ msg : 'success', result : result });
    } catch (err) {
       res.json({ msg : 'fail' });
    }
 });
  

module.exports = router;

