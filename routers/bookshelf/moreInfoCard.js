/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const { AnswerCard, User, Friend, Like, CommentBoard } = require('../../models');
const sanitize = require('../../lib/sanitizeHtml');
const authAddtional = require('../../auth/authAddtional');

router.get('/:questionId', authAddtional, async (req, res) => {
	let userId = '';
	if (res.locals.user) {
		userId = res.locals.user._id;
	}
	try {
		let { questionId } = req.params;
		let { page, sort } = req.query; // 최신(new), 인기(favor), 팔로워(follower)
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const baseQuery = AnswerCard.aggregate()
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
			});
		let allAnswer = [];
		if (sort == 'new') {
			allAnswer = await baseQuery
				.sort({ YYMMDD: -1 })
				.skip(page * 20)
				.limit(20);
		} else if (sort == 'favor') {
			allAnswer = await baseQuery
				.sort({ likes: -1, YYMMDD: -1 })
				.skip(page * 20)
				.limit(20);
		} else if (userId && sort == 'follower') {
			const friendList = await Friend.find({ followingId: userId }).then((followers) =>
				followers.map((follower) => follower.followerId)
			);
			allAnswer = await baseQuery
				.match({ userId: { $in: friendList } })
				.sort({ YYMMDD: -1 })
				.skip(page * 20)
				.limit(20);
		}

		const result = await Promise.all(
			allAnswer.map(async (answer) => {
				const [UserInfo, Comment] = await Promise.all([
					User.findOne({ _id: answer['userId'] }),
					CommentBoard.find({ cardId: answer['_id'] })
				]);
				let currentLike = false;
				let checkCurrentLike = await Like.findOne({
					userId: userId,
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
