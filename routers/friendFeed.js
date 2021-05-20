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
	let result = { msg: 'success', totalFeed: [] };
	try {
		const user = res.locals.user;
		let friendlist = [];
		const myFriend = await Friend.aggregate([
			{ $match: { followingId: user.userId } },
			{ $project: { followerId: 1 } }
		]);

		for (let friend of myFriend) {
			friendlist.push(friend.followerId);
		}

		const friendCards = await AnswerCard.aggregate([
			{ $match: { userId: { $in: friendlist } } },
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
					nickname: { $arrayElemAt: ['$users.nickname', 0] },
					profileImg: { $arrayElemAt: ['$users.profileImg', 0] }
				}
			},
			{ $sort: { createdAt: -1 } },
			{ $limit: 10 }
		]);

		for (let i = 0; i < friendCards.length; i++) {
			let questionInfo = await QuestionCard.findOne({ _id: friendCards[i]['questionId'] });
			friendCards[i]['questionContents'] = questionInfo.contents;
		}

		return res.json({ msg: 'success', friendCards });
	} catch (err) {
		return res.json({ msg: 'fail' });
	}
});

module.exports = router;
