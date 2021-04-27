const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const { QuestionCard, AnswerCard, QuestionDaily, Friend} = require('../models');
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
		const daily = await QuestionDaily.findOne({ userId: user._id, YYMMDD: moment(Date.now()).format('YYMMDD') })
		daily['questions'].splice(daily['questions'].indexOf(req.body['questionId']), 1)
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
			return res.json({ cards : most })
		} else {
			const [tokenType, tokenValue] = authorization.split(' ');
			if (tokenType !== 'Bearer')
			return res.json({ msg: 'fail' });
			const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			const user = await User.findOne({ _id: userId })
			
			if (!user) {
				throw err;
			}
			// QuestionDaily DB에 유저 정보 있는지 확인
			const userDaily = await QuestionDaily.findOne({ userId : user.id })	

			if (!userDaily) { // 회원 가입 후 처음 로그인   
				const most = await mostAnswer()
				QuestionDaily.create({ // DB에 row 생성.
					userId: user._id,
					questions: most,
					YYMMDD: moment(Date.now()).format("YYMMDD")
				})
				return res.json({ cards : most })

			}else{ // 회원 가입 후 처음이 아닌 경우(다시 들어온 사람)
				cards = []
				console.log("회원가입 후 로그인 테스트중")
				const today = moment(Date.now()).format("YYMMDD");
				const userDaily = await QuestionDaily.findOne({ userId: user.id, YYMMDD: today })
				if (userDaily) { // 오늘 처음이 아닌 경우
					const questions = userDaily.questions;
					for (question of questions)
					{
						card = await QuestionCard.findOne({ _id: question.cardId })
						created = await User.findOne({_id: card.createdUser})
						cards.push({
							cardId : card._id,
							topic : card.topic,
							contents : card.contents,
							createdUser : created.nickname
						})
					}
					return res.json({cards :cards})

				} else { //오늘 처음이므로 랜덤으로 3장 추리기 , 7주일 이내 쓴 카드는 뽑으면 안됨!! -> 현재 날짜(Date.now() - (1000 *60 * 60 *24 * 7)) < createdAt ==> fail ==> answer Table
						 // 친구.      / 팔로링 -> FRIEND TABLE에서 배열  반복문 돌림 
						 
					let myCards = []

					friend_ids = await Friend.find({ followingId: userId })
					friends = [] // 친구들 목록
					for (friend of friend_ids) { 
						friends.push(friend.followerId)
					}
					friends_answer = await AnswerCard.find({}).where('userId').in(friends) // 친구들이 쓴 답변 목록
					friendAnswerId = []
					for (answer of friends_answer)
					{
						friendAnswerId.push(answer.userId)
					}
					// 중복제거
					friendAnswerId = new Set(friendAnswerId)
					friendAnswerId = [...friendAnswerId]
					
					// 기간내 카드 제거
					standardTime = moment(Date.now() - (1000 *60 * 60 *24 * 7)).format('YYMMDD')
					notInclude_temp = await AnswerCard.find({ userId: userId }).where('YYMMDD').gt(standardTime)
					notIncludedCards = []
					for (card of notInclude_temp) { 
						notIncludedCards.push(card.questionId)
					}
					
					for (value of notIncludedCards) {
						findIndex = friendAnswerId.indexOf(value)
						if (-1 != findIndex) {
							friendAnswerId.splice(findIndex,1);
						}
					}
					friendsAvailableCards = await QuestionCard.find({}).where('_id').in(friendAnswerId); // 친구가 작성한 카드 중 사용가능한 카드(친구답변카드-내최근카드)
					if (friendsAvailableCards.length){
						let index = Math.floor(Math.random()*friendsAvailableCards.length)
						myCards.push(friendsAvailableCards[index]._id)
					}

					availableCards = await QuestionCard.find({}).where('_id').nin(notIncludedCards); // 전체에서 사용할 수 있는 카드

					while (myCards.length < 3) {
						let index = Math.floor(Math.random() * availableCards.length)
						if (-1 == myCards.indexOf(availableCards[index]._id))
						{
							myCards.push(availableCards[index]._id)
						}
					}
					QuestionDaily.create({ // DB에 row 생성.
						userId: userId,
						questions: myCards,
						YYMMDD: moment(Date.now()).format("YYMMDD")
					})
					return res.json({ cards: myCards })
				}
			}
		}

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

