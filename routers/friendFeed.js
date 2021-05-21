/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const { AnswerCard, User, QuestionCard, Friend, Like, CommentBoard, Search } = require('../models');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

// 친구 피드 받기
router.get('/', authMiddleware, async (req, res) => {
	let result = { msg: 'success', totalFeed: [] };
	try {
		const user = res.locals.user;
		let lastId = req.query['lastId'];

		// const myFriend = await Friend.aggregate([
		// 	{ $match: { followingId: user.userId } },
		// 	{ $project: { followerId: 1 } }
		// ]);

		// for (let friend of myFriend) {
		// 	friendlist.push(friend.followerId);
		// }

		const friendList = await Friend.find({ followingId: user.userId }).then((followers) =>
			followers.map((follower) => follower.followerId)
		);

		const basicQuery = AnswerCard.aggregate([
			{ $match: { userId: { $in: friendList } } },
			{
				$project: {
					_id: 1,
					questionId: 1,
					contents: 1,
					createdAt: 1,
					userId: { $toObjectId: '$userId' }
				}
			},
			{
				$lookup: {
					from: 'users',
					localField: 'userId',
					foreignField: '_id',
					as: 'users'
				}
			},
			{
				$project: {
					_id: 1,
					questionId: 1,
					contents: 1,
					createdAt: 1,
					userId: { $arrayElemAt: ['$users._id', 0] },
					nickname: { $arrayElemAt: ['$users.nickname', 0] },
					profileImg: { $arrayElemAt: ['$users.profileImg', 0] }
				}
			},
			{ $sort: { createdAt: -1 } }
		]);

		let friendCards;
		if (lastId) {
			friendCards = await basicQuery
				.match({ _id: { $lt: mongoose.Types.ObjectId(lastId) } })
				.limit(10);
		} else {
			friendCards = await basicQuery.limit(10);
		}

		for (let i = 0; i < friendCards.length; i++) {
			let questionInfo = await QuestionCard.findOne({ _id: friendCards[i]['questionId'] });
			let commentInfo = await CommentBoard.find({ cardId: friendCards[i]['_id'] });
			let likeInfo = await Like.find({ answerId: friendCards[i]['_id'] });
			friendCards[i]['questionTitle'] = questionInfo.contents;
			friendCards[i]['commentCount'] = commentInfo.length;
			friendCards[i]['likeCount'] = likeInfo.length;
		}
		if (friendCards.length < 10) {
			return res.json({ msg: 'end', friendCards });
		}
		return res.json({ msg: 'success', friendCards });
	} catch (err) {
		return res.json({ msg: 'fail' });
	}
});

module.exports = router;
