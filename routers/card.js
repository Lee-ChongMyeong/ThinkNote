/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const sanitize = require('../lib/sanitizeHtml');
const {
	QuestionCard,
	AnswerCard,
	QuestionDaily,
	Friend,
	Like,
	User,
	CommentBoard,
	Alarm
} = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const mongoose = require('mongoose');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');
require('dotenv').config();

//질문에 대한 답변 쓰기
router.post('/', authMiddleware, async (req, res) => {
	const user = res.locals.user;
	try {
		const { questionId, contents, isOpen } = req.body;
		if (contents <= 1000) {
			return res.status(400).json({ msg: 'check contents length' });
		}
		const daily = await QuestionDaily.updateOne(
			{
				questionId: questionId,
				userId: user._id,
				YYMMDD: moment(Date.now()).format('YYMMDD'),
				available: true
			},
			{ $set: { available: false } }
		);
		if (!daily['nModified']) {
			return res.status(400).json({ msg: 'fail' });
		}
		const result = await AnswerCard.create({
			questionId: questionId,
			contents: sanitize(contents),
			YYMMDD: moment().format('YYMMDD'),
			userId: user.userId,
			isOpen: isOpen
		});

		const todayQuestion = await QuestionDaily.find({
			userId: user.userId,
			YYMMDD: moment(Date.now()).format('YYMMDD')
		});
		let cards = [];
		for (let question of todayQuestion) {
			let ThreeCards = [];
			let questionInfo = await QuestionCard.findOne({ _id: question.questionId });
			const [createdUser, answer, threeAnswer] = await Promise.all([
				User.findOne({ _id: questionInfo.createdUser }),
				AnswerCard.find({ questionId: question.questionId }),
				AnswerCard.find({ questionId: question.questionId }).limit(3)
			]);
			for (let answerData of threeAnswer) {
				let createdUser = await User.findOne({ _id: answerData.userId });
				ThreeCards.push({
					otherProfileImg: createdUser.profileImg,
					otherUserId: createdUser._id
				});
			}
			cards.push({
				cardId: questionInfo._id,
				topic: questionInfo.topic,
				contents: sanitize(questionInfo.contents),
				createdUser: sanitize(createdUser.nickname),
				createdUserId: createdUser._id,
				available: question.available,
				profileImg: sanitize(createdUser.profileImg),
				answerCount: sanitize(answer.length),
				otherProfileImg: ThreeCards
			});
		}

		const { createdUser } = await QuestionCard.findOne({ _id: questionId });
		res.json({ msg: 'success', cards: cards, result: result });
		const alarmSend = require('../lib/sendAlarm');
		await alarmSend(createdUser, questionId, 'answer', user._id, req.alarm);
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

// 질문 랜덤 3개 받기
router.get('/daily', async (req, res) => {
	try {
		const { authorization } = req.headers;
		// 로그인 안했을때
		if (!authorization) {
			let admin_id = '609d27882fe142016da7a7a9';
			const questionCards = await QuestionCard.aggregate([
				{ $project: { _id: { $toString: '$_id' }, createdUser: 1 } },
				{ $match: { createdUser: { $in: [admin_id] } } },
				{ $sample: { size: 3 } }
			]);

			const cards = await Promise.all(
				questionCards.map(async (question) => {
					let ThreeCards = [];
					let questionInfo = await QuestionCard.findOne({ _id: question._id });
					const [createdUser, answer, threeAnswer] = await Promise.all([
						User.findOne({ _id: questionInfo.createdUser }),
						AnswerCard.find({ questionId: question._id }),
						AnswerCard.find({ questionId: question._id }).limit(3)
					]);
					for (let answerData of threeAnswer) {
						let createdUser = await User.findOne({ _id: answerData.userId });
						ThreeCards.push({
							otherProfileImg: createdUser.profileImg,
							otherUserId: createdUser._id
						});
					}
					return {
						cardId: questionInfo._id,
						topic: questionInfo.topic,
						contents: sanitize(questionInfo.contents),
						createdUser: sanitize(createdUser.nickname),
						createdUserId: createdUser._id,
						available: true,
						profileImg: sanitize(createdUser.profileImg),
						answerCount: sanitize(answer.length),
						otherProfileImg: ThreeCards
					};
				})
			);

			return res.json({ cards });
		} else {
			// 로그인 했을때
			const [tokenType, tokenValue] = authorization.split(' ');
			if (tokenType !== 'Bearer') return res.json({ msg: 'fail' });
			const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			const user = await User.findOne({ _id: userId });
			if (!user) {
				throw '로그인되지 않음';
			}
			const today = moment(Date.now()).format('YYMMDD');
			const userDaily = await QuestionDaily.find({ YYMMDD: today, userId: userId });
			let standardTime = moment(Date.now() - 1000 * 60 * 60 * 24 * 14).format('YYMMDD');
			if (userDaily.length == 0) {
				// 오늘 카드를 안받은 경우
				let admin_id = '609d27882fe142016da7a7a9';
				const friends_result = await Friend.aggregate([
					{ $match: { followingId: userId } },
					{ $project: { followerId: 1 } }
				]);
				let friendsCardsId = [admin_id];
				for (let element of friends_result) friendsCardsId.push(element['followerId']);

				let notInclude_temp = await AnswerCard.find({ userId: userId })
					.where('YYMMDD')
					.gt(standardTime); // 내가 (질문에 대해) 일주일 안에 쓴 답변
				const notIncludedCardsId = []; // 일주일내 답변한 카드
				for (let card of notInclude_temp) notIncludedCardsId.push(card.questionId);

				const questionCards = await QuestionCard.aggregate([
					{ $project: { _id: { $toString: '$_id' }, createdUser: 1 } },
					{ $match: { _id: { $nin: notIncludedCardsId } } },
					{ $match: { createdUser: { $in: friendsCardsId } } },
					{ $sample: { size: 3 } }
				]); // 7일 이전, 친구 커스텀
				for (let card of questionCards) {
					const temp = {
						userId: userId,
						questionId: mongoose.Types.ObjectId(card._id),
						YYMMDD: today
					};
					await QuestionDaily.create(temp);
				}
				const todayQuestion = await QuestionDaily.find({ userId: userId, YYMMDD: today });

				const cards = await Promise.all(
					todayQuestion.map(async (question) => {
						let ThreeCards = [];
						let questionInfo = await QuestionCard.findOne({ _id: question.questionId });
						const [createdUser, answer, threeAnswer] = await Promise.all([
							User.findOne({ _id: questionInfo.createdUser }),
							AnswerCard.find({ questionId: question.questionId }),
							AnswerCard.find({ questionId: question.questionId }).limit(3)
						]);

						for (let answerData of threeAnswer) {
							let createdUser = await User.findOne({ _id: answerData.userId });
							ThreeCards.push({
								otherProfileImg: createdUser.profileImg,
								otherUserId: createdUser._id
							});
						}

						return {
							cardId: questionInfo._id,
							topic: questionInfo.topic,
							contents: sanitize(questionInfo.contents),
							createdUser: sanitize(createdUser.nickname),
							createdUserId: createdUser._id,
							available: question.available,
							profileImg: sanitize(createdUser.profileImg),
							answerCount: sanitize(answer.length),
							otherProfileImg: ThreeCards
						};
					})
				);
				return res.json({ cards });
			} else {
				// 재방문인경우
				const todayQuestion = await QuestionDaily.find({ userId: userId, YYMMDD: today });

				const cards = await Promise.all(
					todayQuestion.map(async (question) => {
						let ThreeCards = [];
						let questionInfo = await QuestionCard.findOne({ _id: question.questionId });
						//createdUser가 Null이 뜨는 버그가 있는데, questiondaily를 싹다 비우니까 다시 정상작동됨
						const [createdUser, answer, threeAnswer] = await Promise.all([
							User.findOne({ _id: questionInfo.createdUser }),
							AnswerCard.find({ questionId: question.questionId }),
							AnswerCard.find({ questionId: question.questionId }).limit(3)
						]);

						for (let answerData of threeAnswer) {
							let createdUser = await User.findOne({ _id: answerData.userId });
							ThreeCards.push({
								otherProfileImg: createdUser.profileImg,
								otherUserId: createdUser._id
							});
						}
						return {
							cardId: questionInfo._id,
							topic: questionInfo.topic,
							contents: sanitize(questionInfo.contents),
							createdUser: sanitize(createdUser.nickname),
							createdUserId: createdUser._id,
							available: question.available,
							profileImg: sanitize(createdUser.profileImg),
							answerCount: sanitize(answer.length),
							otherProfileImg: ThreeCards
						};
					})
				);
				return res.json({ cards });
			}
		}
	} catch (err) {
		console.log(err);
		res.status(400).json({ msg: 'fail' });
	}
});

//최신 답변 3개 받기
router.get('/recentAnswer/:cardId', async (req, res) => {
	const cardId = req.params.cardId;
	let answerData = [];
	try {
		const recentAnswerDatas = await AnswerCard.find({ questionId: cardId })
			.sort({ createdAt: -1 })
			.limit(3);
		for (let recentAnswerData of recentAnswerDatas) {
			let answerUser = await User.findOne({ _id: recentAnswerData.userId });
			let temp = {
				questionId: recentAnswerData.questionId,
				answerId: recentAnswerData.answerId,
				contents: sanitize(recentAnswerData.contents),
				profileImg: sanitize(answerUser.profileImg),
				nickname: sanitize(answerUser.nickname),
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
router.get('/recentAnswer/:userId', async (req, res) => {
	const userId = req.params.userId;
	let answerData = [];
	try {
		const today = moment(Date.now()).format('YYMMDD');
		const todayQuestion = await QuestionDaily.find({ userId: userId, YYMMDD: today });
		for (let todayQuestionData of todayQuestion) {
			const recentAnswerData = await AnswerCard.find({
				questionId: todayQuestionData.questionId
			})
				.sort({ createdAt: -1 })
				.limit(3);
			let answerUser = await User.findOne({ _id: recentAnswerData.userId });
			let temp = {
				questionId: recentAnswerData.questionId,
				answerId: recentAnswerData.answerId,
				contents: sanitize(recentAnswerData.contents),
				profileImg: sanitize(answerUser.profileImg),
				nickname: sanitize(answerUser.nickname),
				userId: answerUser.userId
			};
			answerData.push(temp);
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail2' });
	}
	return res.status(200).json({ msg: 'success', answerData });
});

// 내 답변 삭제
router.delete('/myAnswer/:answerId', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		const { answerId } = req.params;
		const checkUser = await AnswerCard.findOne({ _id: answerId });
		if (checkUser.userId == user.userId) {
			await AnswerCard.deleteOne({ userId: user.userId, _id: answerId });
			await CommentBoard.deleteMany({ cardId: answerId });
			await Like.deleteMany({ answerId: answerId });
			await Alarm.deleteMany({ cardId: answerId });
			return res.status(200).json({ msg: '삭제 성공ㅠㅠ' });
		} else {
			return res.status(400).json({ msg: '본인의 글만 삭제할 수 있습니다.' });
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail2' });
	}
});

// 내 답변 수정
router.patch('/myAnswer', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		const { answerId, contents, isOpen } = req.body;
		const checkUser = await AnswerCard.findOne({ _id: answerId });
		if (checkUser.userId == user.userId) {
			await AnswerCard.updateOne({ _id: answerId }, { $set: { contents, isOpen } });
			return res.status(200).json({ msg: '수정 성공!' });
		} else {
			return res.status(400).json({ msg: '본인의 글만 수정할 수 있습니다.' });
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
