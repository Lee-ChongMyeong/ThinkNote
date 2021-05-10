const express = require('express');
const router = express.Router();
const { AnswerCard, User, Friend, Like, CommentBoard } = require('../../models');
const authMiddleware = require('../../auth/authMiddleware');
const jwt = require('jsonwebtoken');
const sanitize = require('sanitize-html');

// 더보기 답변들
// 기본 내려주기
router.get('/:questionId', async (req, res) => {
	let userId = '';
	try {
		const { authorization } = req.headers;
		console.log(authorization);
		const [tokenType, tokenValue] = authorization.split(' ');
		if (tokenType == 'Bearer') {
			const payload = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			userId = payload.userId;
		}
	} catch (error) {
		console.log(error);
		console.log('토큰 해독 에러');
	}

	try {
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const { questionId } = req.params;

		const allAnswer = await AnswerCard.aggregate([
			{ $match: { questionId: { $eq: questionId } } },
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
			{ $sort: { YYMMDD: -1 } },
			{ $skip: page * 20 },
			{ $limit: 20 },
			{
				$project: {
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' },
					createdAt: 1
				}
				// answerId: '$_id'
			}
		]);

		const answer = [];
		for (let i = 0; i < allAnswer.length; i++) {
			const UserInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
			// 질문카드 만든 날짜
			const Comment = await CommentBoard.find({ cardId: allAnswer[i]['_id'] });
			let currentLike = false;
			let checkCurrentLike = await Like.findOne({
				userId: userId,
				answerId: allAnswer[i]['_id']
			});
			if (checkCurrentLike) {
				currentLike = true;
			}
			answer.push({
				userId: UserInfo._id,
				userNickname: UserInfo.nickname,
				userProfileImg: UserInfo.profileImg,
				answerId: allAnswer[i]['_id'],
				answerContents: sanitize(allAnswer[i]['contents']),
				answerLikes: allAnswer[i]['likes'],
				commentCount: Comment.length,
				createdAt: allAnswer[i]['createdAt'],
				like: currentLike
			});
		}
		return res.send({ answer });
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 더보기 답변들
// 친구가 쓴 것만 (로그인 안했을 경우는 로그인 필요한 기능이라고 뜨게 말하기)
router.get('/friend/:questionId', authMiddleware, async (req, res) => {
	let userId = '';
	try {
		const { authorization } = req.headers;
		const [tokenType, tokenValue] = authorization.split(' ');
		if (tokenType == 'Bearer') {
			const payload = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			userId = payload.userId;
		}
	} catch (error) {
		console.log(error);
		console.log('토큰 해독 에러');
	}

	try {
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;
		const { questionId } = req.params;
		const user = res.locals.user;

		// 친구 감별
		const followerId = await Friend.find({ followingId: user.userId });
		const friendList = [];

		for (let i = 0; i < followerId.length; i++) {
			friendList.push(followerId[i]['followerId']);
		}

		const allAnswer = await AnswerCard.aggregate([
			{ $match: { userId: { $in: friendList }, questionId: { $eq: questionId } } },
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
			{ $sort: { likes: -1 } },
			{ $skip: page * 20 },
			{ $limit: 20 },
			{
				$project: {
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' },
					createdAt: 1
				}
			}
		]);

		const answer = [];
		for (let i = 0; i < allAnswer.length; i++) {
			const Comment = await CommentBoard.find({ cardId: allAnswer[i]['_id'] });
			const userInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
			let currentLike = false;
			let checkCurrentLike = await Like.findOne({
				userId: userId,
				answerId: allAnswer[i]['_id']
			});
			if (checkCurrentLike) {
				currentLike = true;
			}
			answer.push({
				userId: userInfo._id,
				userNickname: userInfo.nickname,
				userProfileImg: userInfo.profileImg,
				answerId: allAnswer[i]['_id'],
				answerContents: sanitize(allAnswer[i]['contents']),
				answerLikes: allAnswer[i]['likes'],
				commentCount: Comment.length,
				createdAt: allAnswer[i]['createdAt'],
				like: currentLike
			});
		}
		return res.json(answer);
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 더보기 답변 좋아요순
router.get('/like/:questionId', async (req, res) => {
	let userId = '';
	try {
		const { authorization } = req.headers;
		const [tokenType, tokenValue] = authorization.split(' ');
		if (tokenType == 'Bearer') {
			const payload = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			userId = payload.userId;
		}
	} catch (error) {
		console.log(error);
		console.log('토큰 해독 에러');
	}

	try {
		const { questionId } = req.params;
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const allAnswer = await AnswerCard.aggregate([
			{ $match: { questionId: { $eq: questionId } } },
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
			{ $sort: { likes: -1 } },
			{ $skip: page * 20 },
			{ $limit: 20 },
			{
				$project: {
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' },
					createdAt: 1
				}
				// answerId: '$_id'
			}
		]);

		let answer = [];
		for (let i = 0; i < allAnswer.length; i++) {
			const userInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
			const Comment = await CommentBoard.find({ cardId: allAnswer[i]['_id'] });
			let currentLike = false;
			let checkCurrentLike = await Like.findOne({
				userId: userId,
				answerId: allAnswer[i]['_id']
			});
			if (checkCurrentLike) {
				currentLike = true;
			}
			answer.push({
				userId: userInfo._id,
				userNickname: userInfo.nickname,
				userProfileImg: userInfo.profileImg,
				answerId: allAnswer[i]['_id'],
				answerContents: allAnswer[i]['contents'],
				answerLikes: allAnswer[i]['likes'],
				commentCount: Comment.length,
				createdAt: allAnswer[i]['createdAt'],
				like: currentLike
			});
		}
		// 유저 정보 넣어주기 이름이랑 값
		return res.json(answer);
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
