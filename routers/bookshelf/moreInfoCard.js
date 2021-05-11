const express = require('express');
const router = express.Router();
const { AnswerCard, User, Friend, Like, CommentBoard } = require('../../models');
const jwt = require('jsonwebtoken');
const sanitize = require('sanitize-html');

// 인기, 팔로워, 최신
router.get('/:questionId', async (req, res) => {
	const { authorization } = req.headers;
	let userId = '';
	try {
		if (authorization) {
			const [tokenType, tokenValue] = authorization.split(' ');
			if (tokenType == 'Bearer') {
				const payload = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
				userId = payload.userId;
			}
		}
	} catch (err) {
		console.log('토큰 해독 에러');
	}
	try {
		let { questionId } = req.params;
		let { page, sort } = req.query; // 최신(new), 인기(favor), 팔로워(follower)
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;
		let allAnswer = [];

		if (sort == 'new') {
			allAnswer = await AnswerCard.aggregate()
				.match({ questionId: { $eq: questionId } })
				.project({
					_id: { $toString: '$_id' },
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					createdAt: 1
				})
				.lookup({ from: 'likes', localField: '_id', foreignField: 'answerId', as: 'likes' })
				.project({
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' },
					createdAt: 1
				})
				.sort({ YYMMDD: -1 })
				.skip(page * 20)
				.limit(20);
		} else if (sort == 'favor') {
			allAnswer = await AnswerCard.aggregate()
				.match({ questionId: { $eq: questionId } })
				.project({
					_id: { $toString: '$_id' },
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					createdAt: 1
				})
				.lookup({ from: 'likes', localField: '_id', foreignField: 'answerId', as: 'likes' })
				.project({
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' },
					createdAt: 1
				})
				.sort({ likes: -1, YYMMDD: -1 })
				.skip(page * 20)
				.limit(20);
		} else {
			const followerId = await Friend.find({ followingId: userId });
			const friendList = [];
			for (let i = 0; i < followerId.length; i++) {
				friendList.push(followerId[i]['followerId']);
			}

			allAnswer = await AnswerCard.aggregate()
				.match({ questionId: { $eq: questionId } })
				.project({
					_id: { $toString: '$_id' },
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					createdAt: 1
				})
				.lookup({
					from: 'likes',
					localField: '_id',
					foreignField: 'answerId',
					as: 'likes'
				})
				.project({
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' },
					createdAt: 1
				})
				.match({ userId: { $in: friendList } })
				.sort({ YYMMDD: -1 })
				.skip(page * 20)
				.limit(20);
		}

		// eslint-disable-next-line no-undef
		const result = await Promise.all(
			allAnswer.map(async (answer) => {
				const UserInfo = await User.findOne({ _id: answer['userId'] });
				const Comment = await CommentBoard.find({ cardId: answer['_id'] });
				let currentLike = false;
				let checkCurrentLike = await Like.findOne({
					userId: res.userId,
					answerId: answer['_id']
				});
				if (checkCurrentLike) {
					currentLike = true;
				}
				return {
					userId: UserInfo._id,
					userNickname: sanitize(UserInfo.nickname),
					userProfileImg: UserInfo.profileImg,
					answerId: answer['_id'],
					answerContents: sanitize(answer['contents']),
					answerLikes: answer['likes'],
					commentCount: Comment.length,
					createdAt: answer['createdAt'],
					like: currentLike
				};
			})
		);
		return res.send({ answer: result });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
