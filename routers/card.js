const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const { QuestionCard, AnswerCard, QuestionDaily} = require('../models');
const authMiddleware = require('../auth/authMiddleware')
const User = require('../models/user');
const jwt = require('jsonwebtoken')
const mostAnswer = require('../lib/mostAnswer')
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

//질문에 대한 답변 쓰기
router.post('/', authMiddleware, async (req, res, next) => {
	user = res.locals.user;
	try {
		const result = await AnswerCard.create({
			questionId: req.body['questionId'],
			contents: req.body['contents'],
			YYMMDD: moment().format("YYMMDD"),
			userId: user.userId,
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

		//// 2. 처음 가입하고 처음 로그인한 사람 -> 기본카드 3개 .. dailyquestionId 검색했는데 안나온다 / dailyquestion(하루에 사용자가 받는 질문 3개) 을 만들어야 된다. 
		//// 3. 로그인 했는데 오늘 처음 요청 -> 랜덤 카드 3개 -> daily question에 넣어야 된다. --> 순서대로 꺼내기
		//// 4.  다시 들어온 사람 -> 남아있는 카드를 보여줘야 된다.

		//// 문제점
		//// 2) 유저가 접속했을때 YYMMDD 값을 알아야됨

		const { authorization } = req.headers;
		if (!authorization) { // 로그인 안한 유저
			const most = await mostAnswer()
			return res.json({ cards: most })
		} else {
			const [tokenType, tokenValue] = authorization.split(' ');
			if (tokenType !== 'Bearer')
			return res.json({ msg: 'fail' });
			const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			console.log(userId)	// o.k
			const user = await User.findOne({ _id: userId })
			console.log('==========================')
			console.log(user)
			
			if (!user) {
				throw err;
			}
			
			const userDaily = await QuestionDaily.findOne({ userId : user.id })
			console.log(userDaily)	
			
			// Date.now() - (1000 * 60 * 60 * 24 * 7) < createdAt

			if (!userDaily) { // 회원 가입 후 처음 로그인   7주일 이내 쓴 카드는 뽑으면 안됨!! -> 현재 날짜(Date.now() - (1000 *60 * 60 *24 * 7)) < createdAt ==> fail ==> answer Table
				const most = await mostAnswer()
				QuestionDaily.create({ //questions : [ 1, 2, 3]
					userId: user._id,
					questions: most,
					date: moment(Date.now()).format("YYMMDD")
				})
				return res.json({ cards: most })

			}else{ // 회원 가입 후 처음이 아닌 경우(다시 들어온 사람)
				cards = []
				console.log("회원가입 후 로그인 테스트중")
				const today = moment(Date.now()).format("YYMMDD");
				const userDaily = await QuestionDaily.findOne({ userId: user.id, YYMMDD: today })
				console.log(userDaily)
				if (userDaily) { // 오늘 처음이 아닌 경우
					const questions = userDaily.questions;
					for (let i in questions){
						card = await QuestionCard.findOne({ cardId: questions[i] })
						cards.push({
							cardId : card._id,
							topic : card.topic,
							contents : card.contents,
							createdUser : card.nickname
						})
					}
						



				} else { //오늘 처음이므로 랜덤으로 3장 추리기
					
				}
				
				// 최근 7일 내에 작성안한것을 찾아서, questionCard를 랜덤으로 세장을 뽑기

				res.json({today})
			}

		}









		// let questionCardDatas = await QuestionCard.find({}).sort({ date: -1 }).limit(3);
		// let questionDailyDatas = await QuestionDaily.find({}).sort({date : -1});
		
		// const profileData = await User.findOne({});	
		// console.log(profileData)

		// for (questionCardData of questionCardDatas) {
		// 	let temp = {
		// 		cardId: questionCardData._id,
		// 		topic: questionCardData['topic'],
		// 		contents: questionCardData['contents'],
		// 		createdUser: questionCardData['createdUser'],
		// 	};

		// 	if (!questionDailyDates.includes(cardId)) {
		// 		result['dailyData'].push(temp);
		// 	}

		// }	


	

	} catch (err) {
		console.log(err);
		res.status(400).json({ msg : 'fail' });
	}
});

// Daily 질문 대답했을 때
// router.post('/daily', authMiddleware, async (req, res, next) => {
// 	user = res.locals.user;	
//     try {
//         const result = await QuestionDaily.create({
// 			userId : user.userId,
// 			date : moment().format("YYMMDD"),
// 			question_one : req.body["question_one"],	// cardIdd값 들어가게
// 			question_two : req.body["question_two"],
// 			question_thr : req.body["question_thr"]
//        });
// 	   console.log(result)
//        res.json({ msg : 'success', result : result });
//     } catch (err) {
//        res.json({ msg : 'fail' });
//     }
//  });

module.exports = router;

