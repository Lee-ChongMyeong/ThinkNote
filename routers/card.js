const express = require('express');
const router = express.Router();
const sanitizeHtml = require('sanitize-html');
const { QuestionCard, AnswerCard, QuestionDaily, Friend, User } = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const mongoose = require('mongoose');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');
require('dotenv').config();

//질문에 대한 답변 쓰기
router.post('/', authMiddleware, async (req, res, next) => {
	user = res.locals.user;
	try {
		const { questionId, contents, isOpen } = req.body;
		// console.log('userid', user.userId)
		// 글자제한
		// if (contents.length < 4) {
		// 	return res.json({ msg: 'typenumber error' })
		// }
		const daily = await QuestionDaily.updateOne({ questionId: questionId, userId: user._id, YYMMDD: moment(Date.now()).format('YYMMDD') }, { $set: { available: false } });
		// console.log('daily', daily);
		// console.log(moment(Date.now()).format('YYMMDD'))
		if (daily['questionId'] == req.body['questionId']) {
			return res.status(400).json({ msg: 'fail1' });
		}
		const result = await AnswerCard.create({
			questionId: questionId,
			contents: contents,
			YYMMDD: moment().format('YYMMDD'),
			userId: user.userId,
			isOpen: isOpen
		});

		const todayQuestion = await QuestionDaily.find({ userId: user.userId, YYMMDD: moment(Date.now()).format('YYMMDD') });
		// console.log('todayQuestion', todayQuestion)

		// for (question of todayQuestion) {
		// 	let ThreeCards = [];
		// 	console.log(question)
		// 	let questionInfo = await QuestionCard.findOne({ _id: question.questionId });
		// 	let createdUser = await User.findOne({ _id: questionInfo.createdUser });
		// 	let answer = await AnswerCard.find({ questionId: question.questionId });

		// 	let threeAnswer = await AnswerCard.find({ questionId: question._id }).limit(3);
		// 	console.log(threeAnswer)
		// 	for (answerData of threeAnswer) {
		// 		let createdUser = await User.findOne({ _id: answerData.userId });
		// 		ThreeCards.push({ otherProfileImg: createdUser.profileImg })
		// 	}
		// 	console.log('====')
		// 	console.log(ThreeCards)

		// 	cards.push({
		// 		cardId: questionInfo._id,
		// 		topic: questionInfo.topic,
		// 		contents: questionInfo.contents,
		// 		createdUser: createdUser.nickname,
		// 		createdUserId: createdUser._id,
		// 		available: question.available,
		// 		profileImg: createdUser.profileImg,
		// 		answerCount: answer.length,
		// 		otherProfileImg: ThreeCards
		// 	});
		// }
		let cards = [];
		for (question of todayQuestion) {
			let ThreeCards = [];
			let questionInfo = await QuestionCard.findOne({ _id: question.questionId });
			let createdUser = await User.findOne({ _id: question.createdUser });
			let answer = await AnswerCard.find({ questionId: question.questionId });
			let threeAnswer = await AnswerCard.find({ questionId: question._id }).limit(3);
			for (answerData of threeAnswer) {
				let createdUser = await User.findOne({ _id: answerData.userId });
				ThreeCards.push({ otherProfileImg: createdUser.profileImg })
			}
			console.log(ThreeCards)
			cards.push({
				cardId: questionInfo._id,
				topic: questionInfo.topic,
				contents: questionInfo.contents,
				createdUser: createdUser.nickname,
				createdUserId: createdUser._id,
				available: question.available,
				profileImg: createdUser.profileImg,
				answerCount: answer.length,
				otherProfileImg: ThreeCards
			});
		}
		console.log('====')
		console.log(cards)

		const { createdUser } = await QuestionCard.findOne({ _id: questionId });

		res.json({ msg: 'success', cards: cards, result: result });

		const alarmSend = require('../lib/sendAlarm');
		await alarmSend(createdUser, questionId, 'answer', user._id, req.alarm);
	} catch (err) {
		console.log(err)
		return res.status(400).json({ msg: 'fail2' });
	}
})

// 질문 랜덤 3개 받기
router.get('/daily', async (req, res) => {
	let result = { msg: 'success', dailyData: [] };
	try {
		const { authorization } = req.headers;
		// 로그인 안했을때
		if (!authorization) {
			let admin_id = '608971a172444320da6e8671';
			const questionCards = await QuestionCard.aggregate([
				{ $project: { _id: { $toString: '$_id' }, createdUser: 1 } },
				{ $match: { createdUser: { $in: [admin_id] } } },
				{ $sample: { size: 3 } }
			]);
			let cards = [];
			for (question of questionCards) {
				let ThreeCards = [];
				let questionInfo = await QuestionCard.findOne({ _id: question._id });
				let createdUser = await User.findOne({ _id: question.createdUser });
				let answer = await AnswerCard.find({ questionId: question._id });
				let threeAnswer = await AnswerCard.find({ questionId: question._id }).limit(3);
				for (answerData of threeAnswer) {
					let createdUser = await User.findOne({ _id: answerData.userId });
					ThreeCards.push({ otherProfileImg: createdUser.profileImg })
				}
				cards.push({
					cardId: questionInfo._id,
					topic: questionInfo.topic,
					contents: questionInfo.contents,
					createdUser: createdUser.nickname,
					createdUserId: createdUser._id,
					available: true,
					profileImg: createdUser.profileImg,
					answerCount: answer.length,
					otherProfileImg: ThreeCards
				});
			}
			return res.json({ cards });
		} else { // 로그인 했을때 
			const [tokenType, tokenValue] = authorization.split(' ');
			if (tokenType !== 'Bearer') return res.json({ msg: 'fail' });
			const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			const user = await User.findOne({ _id: userId });
			if (!user) {
				throw err;
			}
			const today = moment(Date.now()).format('YYMMDD');
			const userDaily = await QuestionDaily.find({ YYMMDD: today, userId: userId });
			standardTime = moment(Date.now() - 1000 * 60 * 60 * 24 * 7).format('YYMMDD');
			if (userDaily.length == 0) {
				// 오늘 카드를 안받은 경우
				let admin_id = '608971a172444320da6e8671';
				const friends_result = await Friend.aggregate([{ $match: { followingId: userId } }, { $project: { followerId: 1 } }]);
				let friendsCardsId = [admin_id];
				for (element of friends_result) friendsCardsId.push(element['followerId']);

				notInclude_temp = await AnswerCard.find({ userId: userId }).where('YYMMDD').gt(standardTime); // 내가 (질문에 대해) 일주일 안에 쓴 답변
				notIncludedCardsId = []; // 일주일내 답변한 카드
				for (card of notInclude_temp) notIncludedCardsId.push(card.questionId);

				const questionCards = await QuestionCard.aggregate([
					{ $project: { _id: { $toString: '$_id' }, createdUser: 1 } },
					{ $match: { _id: { $nin: notIncludedCardsId } } },
					{ $match: { createdUser: { $in: friendsCardsId } } },
					{ $sample: { size: 3 } }
				]); // 7일 이전, 친구 커스텀
				for (card of questionCards) {
					temp = {
						userId: userId,
						questionId: mongoose.Types.ObjectId(card._id),
						YYMMDD: today
					};
					await QuestionDaily.create(temp);
				}
				let cards = [];
				const todayQuestion = await QuestionDaily.find({ userId: userId, YYMMDD: today });
				for (question of todayQuestion) {
					let ThreeCards = [];
					let questionInfo = await QuestionCard.findOne({ _id: question.questionId });
					let createdUser = await User.findOne({ _id: questionInfo.createdUser });
					let answer = await AnswerCard.find({ questionId: question.questionId });
					let threeAnswer = await AnswerCard.find({ questionId: question.questionId }).limit(3);
					for (answerData of threeAnswer) {
						let createdUser = await User.findOne({ _id: answerData.userId });
						ThreeCards.push({ otherProfileImg: createdUser.profileImg })
					}

					cards.push({
						cardId: questionInfo._id,
						topic: questionInfo.topic,
						contents: questionInfo.contents,
						createdUser: createdUser.nickname,
						createdUserId: createdUser._id,
						available: question.available,
						profileImg: createdUser.profileImg,
						answerCount: answer.length,
						otherProfileImg: ThreeCards
					});
				}
				return res.json({ cards });
			} else {
				// 재방문인경우
				let cards = [];

				const todayQuestion = await QuestionDaily.find({ userId: userId, YYMMDD: today });


				for (question of todayQuestion) {
					let ThreeCards = [];
					let questionInfo = await QuestionCard.findOne({ _id: question.questionId });
					let createdUser = await User.findOne({ _id: questionInfo.createdUser });
					let answer = await AnswerCard.find({ questionId: question.questionId });
					let threeAnswer = await AnswerCard.find({ questionId: question.questionId }).limit(3);
					for (answerData of threeAnswer) {
						let createdUser = await User.findOne({ _id: answerData.userId });
						ThreeCards.push({ otherProfileImg: createdUser.profileImg })
					}

					cards.push({
						cardId: questionInfo._id,
						topic: questionInfo.topic,
						contents: questionInfo.contents,
						createdUser: createdUser.nickname,
						createdUserId: createdUser._id,
						available: question.available,
						profileImg: createdUser.profileImg,
						answerCount: answer.length,
						otherProfileImg: ThreeCards
					});
				}
				return res.json({ cards });
			}
		}
	} catch (err) {
		console.log(err);
		res.status(400).json({ msg: 'fail' });
	}
});

//최신 답변 3개 받기
router.get('/recentAnswer/:cardId', async (req, res, next) => {
	const cardId = req.params.cardId;
	let answerData = [];
	try {
		const recentAnswerDatas = await AnswerCard.find({ questionId: cardId }).sort({ createdAt: -1 }).limit(3);
		for (recentAnswerData of recentAnswerDatas) {
			let answerUser = await User.findOne({ _id: recentAnswerData.userId });
			let temp = {
				questionId: recentAnswerData.questionId,
				answerId: recentAnswerData.answerId,
				contents: recentAnswerData.contents,
				profileImg: answerUser.profileImg,
				nickname: answerUser.nickname,
				userId: answerUser.userId
			};
			answerData.push(temp);
		}
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
	return res.status(200).json({ msg: 'success', answerData });
});

// 최신답변 3개 받기(데이터 한번에)
// 임시 정지
router.get('/recentAnswer/:userId', async (req, res, next) => {
	const userId = req.params.userId;
	let answerData = [];
	try {
		const todayQuestion = await QuestionDaily.find({ userId: userId, YYMMDD: today });
		for (todayQuestionData of todayQuestion) {
			const recentAnswerData = await AnswerCard.find({ questionId: todayQuestionData.questionId }).sort({ createdAt: -1 }).limit(3);
			let answerUser = await User.findOne({ _id: recentAnswerData.userId });
			let temp = {
				questionId: recentAnswerData.questionId,
				answerId: recentAnswerData.answerId,
				contents: recentAnswerData.contents,
				profileImg: answerUser.profileImg,
				nickname: answerUser.nickname,
				userId: answerUser.userId
			};
			answerData.push(temp);
		}
	} catch (err) {
		console.log(err)
		return res.status(400).json({ msg: 'fail2' });
	}
	return res.status(200).json({ msg: 'success', answerData });
});


module.exports = router;
