/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const { AnswerCard, User, QuestionCard, Friend, Like, CommentBoard, Search } = require('../models');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

// 친구 피드 받기
router.get('/', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		let friendlist = [];
		console.log(user.userId);
		const myFriend = await Friend.aggregate([
			{ $match: { followingId: user.userId } },
			{ $project: { followerId: 1 } }
		]);

		for (let friend of myFriend) {
			friendlist.push(friend.followerId);
		}
		console.log(friendlist);

		const friendCards = await AnswerCard.aggregate([
			{ $match: { userId: { $in: friendlist } } },
			{
				$project: {
					_id: 1,
					questionId: 1,
					contents: 1,
					YYMMDD: 1,
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
					YYMMDD: 1,
					nickname: { $arrayElemAt: ['$users.nickname', 0] },
					profileImg: { $arrayElemAt: ['$users.profileImg', 0] }
				}
			},
			{ $sort: { createdAt: -1 } },
			{ $limit: 5 }
		]);
		return res.json({ msg: 'success', friendCards });
	} catch (err) {
		return res.json({ msg: 'fail' });
	}
});

module.exports = router;
