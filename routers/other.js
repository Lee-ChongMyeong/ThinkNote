const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const { AnswerCard, User, QuestionCard, Friend, Like } = require('../models');
const sanitize = require('sanitize-html');

// 다른 사람 책장 일별 확인
router.get('/bookDetail/:YYMMDD/:id', authMiddleware, async (req, res) => {
	try {
		const { YYMMDD } = req.params;
		const { id } = req.params;
		const booksDetail = await AnswerCard.find({ userId: id, YYMMDD: YYMMDD });
		const booksDiary = [];
		for (let i = 0; i < booksDetail.length; i++) {
			const { contents, createdUser, _id, topic } = await QuestionCard.findOne({
				_id: booksDetail[i]['questionId']
			});
			const questionUserInfo = await User.findOne({ _id: createdUser });
			const likeCount = await Like.find({ answerId: booksDetail[i]['_id'] });
			const likeCountNum = likeCount.length;

			booksDiary.push({
				questionId: _id,
				questionCreatedUserId: questionUserInfo._id,
				questionCreatedUserNickname: questionUserInfo.nickname,
				questionCreatedUserProfileImg: questionUserInfo.profileImg,
				questionContents: contents,
				questionTopic: topic,
				answerId: booksDetail[i]['_id'],
				answerContents: booksDetail[i]['contents'],
				answerUserNickname: '', //수정 필요!!!!!!!!!!!!
				isOpen: booksDetail[i]['isOpen'],
				likeCount: likeCountNum
			});
		}
		return res.send({ booksDiary });
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 타인의 친구 목록
router.get('/friendList/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const friendList = await Friend.find({ followingId: id });
		const othersFriend = [];
		for (let i = 0; i < friendList.length; i++) {
			const friendInfo = await User.findOne({ _id: friendList[i]['followerId'] });
			othersFriend.push({
				otherFriendId: friendInfo._id,
				otherFriendNickname: sanitize(friendInfo.nickname),
				otherFriendProfileImg: friendInfo.profileImg
			});
		}
		return res.send({ othersFriend });
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

//다른 사람 커스텀 카드 질문조회 (최신순)
router.get('/:id/question', authMiddleware, async (req, res) => {
	try {
		let { page } = req.query;
		const { id } = req.params;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;
		const allOtherQuestion = await QuestionCard.find({ createdUser: id });
		const otherCustomQuestionCard = await QuestionCard.find({ createdUser: id })
			.sort('-createdAt')
			.skip(page * 15)
			.limit(15);
		const otherQuestion = [];

		for (let i = 0; i < otherCustomQuestionCard.length; i++) {
			let answerData = await AnswerCard.find({
				questionId: otherCustomQuestionCard[i]['_id'],
				isOpen: true
			});

			otherQuestion.push({
				questionId: otherCustomQuestionCard[i]['_id'],
				questionContents: sanitize(otherCustomQuestionCard[i]['contents']),
				questionTopic: otherCustomQuestionCard[i]['topic'],
				questionCreatedAt: otherCustomQuestionCard[i]['createdAt'],
				answerCount: answerData.length
			});
			//질문에 몇명답했는지
		}
		return res.send({
			otherQuestion: otherQuestion,
			otherQuestionCount: allOtherQuestion.length
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

//다른 사람 커스텀 카드 질문조회 (인기순)
router.get('/like/:id/question', authMiddleware, async (req, res) => {
	try {
		let { page } = req.query;
		const { id } = req.params;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const otherCustomQuestionCard = await QuestionCard.aggregate([
			{ $match: { createdUser: { $eq: id } } },
			{ $project: { _id: { $toString: '$_id' }, topic: 1, contents: 1, createdUser: 1 } },
			{
				$lookup: {
					from: 'answercards',
					localField: '_id',
					foreignField: 'questionId',
					as: 'answercards'
				}
			},
			{ $sort: { answercards: -1 } },
			{ $skip: page * 15 },
			{ $limit: 15 },
			{
				$project: {
					_id: 1,
					contents: 1,
					createdUser: 1,
					answerLength: { $size: '$answercards' }
				}
			}
		]);

		let result = [];
		for (let i = 0; i < otherCustomQuestionCard.length; i++) {
			result.push({
				questionId: otherCustomQuestionCard[i]['_id'],
				questionContents: sanitize(otherCustomQuestionCard[i]['contents']),
				questionTopic: otherCustomQuestionCard[i]['topic'],
				questionCreatedAt: otherCustomQuestionCard[i]['createdAt'],
				answerCount: otherCustomQuestionCard[i]['answerLength']
			});
			//질문에 몇명답했는지
		}
		return res.send({
			result: result
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
