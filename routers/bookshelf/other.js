const express = require('express');
const router = express.Router();
const authMiddleware = require('../../auth/authMiddleware');
const { AnswerCard, User, QuestionCard, Friend, Like, CommentBoard } = require('../../models');
const sanitize = require('sanitize-html');

// 다른 사람 책장 월별 확인
router.get('/books/:YYMM/:id', async (req, res) => {
	try {
		const { YYMM } = req.params;
		const { id } = req.params;
		const books = await AnswerCard.aggregate([
			{ $match: { userId: id, YYMMDD: { $regex: `${YYMM}..` } } },
			{ $group: { _id: '$YYMMDD', count: { $sum: 1 } } }
		]).sort({ _id: '-1' });
		return res.send({
			books: books
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 다른 사람 책장 일별 확인
router.get('/bookDetail/:YYMMDD/:id', async (req, res) => {
	try {
		const { YYMMDD } = req.params;
		const { id } = req.params;
		const booksDetail = await AnswerCard.find({ userId: id, YYMMDD: YYMMDD, isOpen: true });
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
router.get('/:id/question', async (req, res) => {
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
router.get('/like/:id/question', async (req, res) => {
	try {
		let { page } = req.query;
		const { id } = req.params;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const otherCustomQuestionCard = await QuestionCard.aggregate([
			{ $match: { createdUser: { $eq: id } } },
			{
				$project: {
					_id: { $toString: '$_id' },
					topic: 1,
					contents: 1,
					createdUser: 1,
					createdAt: 1
				}
			},
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
					topic: 1,
					createdAt: 1,
					_id: 1,
					contents: 1,
					createdUser: 1,
					answerLength: { $size: '$answercards' }
				}
			},
			{ $sort: { answerLength: -1, createdAt: -1 } },
			{ $skip: page * 15 },
			{ $limit: 15 }
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

// 다른 사람이 작성한 답변 모음 (최신순)
router.get('/answers/:id', authMiddleware, async (req, res) => {
	try {
		const { id } = req.params;
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		let allMyAnswer = [];

		const answerCount = await AnswerCard.find({ userId: id });
		const myAnswerInfo = await AnswerCard.find({ userId: id, isOpen: true })
			.sort('-createdAt')
			.skip(page * 15)
			.limit(15);

		for (let i = 0; i < myAnswerInfo.length; i++) {
			//좋아요 상태확인
			let currentLike = false;
			let checkCurrentLike = await Like.findOne({
				userId: id,
				answerId: myAnswerInfo[i]['_id']
			});
			if (checkCurrentLike) {
				currentLike = true;
			}

			const questionInfo = await QuestionCard.findOne({ _id: myAnswerInfo[i]['questionId'] });
			const questionCreatedUserInfo = await User.findOne({ id: questionInfo.userId });
			const like = await Like.find({ answerId: myAnswerInfo[i]['_id'] });
			const comment = await CommentBoard.find({ cardId: myAnswerInfo[i]['_id'] });
			allMyAnswer.push({
				questionCreatedUserNickname: questionCreatedUserInfo.nickname,
				questionCreatedUserId: questionCreatedUserInfo._id,
				questiontopic: questionInfo.topic,
				questionContents: questionInfo.contents,
				answerContents: myAnswerInfo[i]['contents'],
				answerCreatedAt: myAnswerInfo[i]['YYMMDD'],
				likeCount: like.length,
				commentCount: comment.length,
				currentLike: currentLike
			});
		}

		return res.send({ answerCount: answerCount.length, allMyAnswer });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

// 다른 사람이 작성한 답변 모음 (좋아요순)
router.get('/answers/:id/like', authMiddleware, async (req, res) => {
	try {
		const { id } = req.params;
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const answerCount = await AnswerCard.find({ userId: id, isOpen: true });
		const myAnswerInfo = await AnswerCard.aggregate([
			{ $match: { userId: { $eq: id } } },
			{
				$project: {
					_id: { $toString: '$_id' },
					questionId: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					createdAt: 1
				}
			},
			{
				$lookup: { from: 'likes', localField: '_id', foreignField: 'answerId', as: 'likes' }
			},
			{
				$project: {
					questionId: 1,
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' },
					createdAt: 1
				}
			},
			{ $sort: { likes: -1 } },
			{ $skip: page * 15 },
			{ $limit: 15 }
		]);
		let allMyAnswer = [];
		for (let i = 0; i < myAnswerInfo.length; i++) {
			//좋아요 상태확인
			let currentLike = false;
			let checkCurrentLike = await Like.findOne({
				userId: id,
				answerId: myAnswerInfo[i]['_id']
			});
			if (checkCurrentLike) {
				currentLike = true;
			}
			const questionInfo = await QuestionCard.findOne({ _id: myAnswerInfo[i]['questionId'] });
			const questionCreatedUserInfo = await User.findOne({ id: questionInfo.userId });
			const like = await Like.find({ answerId: myAnswerInfo[i]['_id'] });
			const comment = await CommentBoard.find({ cardId: myAnswerInfo[i]['_id'] });
			allMyAnswer.push({
				questionCreatedUserNickname: questionCreatedUserInfo.nickname,
				questionCreatedUserId: questionCreatedUserInfo._id,
				questiontopic: questionInfo.topic,
				questionContents: questionInfo.contents,
				answerContents: myAnswerInfo[i]['contents'],
				answerCreatedAt: myAnswerInfo[i]['YYMMDD'],
				likeCount: like.length,
				commentCount: comment.length,
				currentLike: currentLike
			});
		}
		return res.send({ answerCount: answerCount.length, allMyAnswer });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
