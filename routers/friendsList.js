/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const { User, Friend } = require('../models');
const sanitize = require('../lib/sanitizeHtml');
const mongoose = require('mongoose');

require('dotenv').config();
const authAdditional = require('../auth/authAddtional');

// 팔로잉 목록
router.get('/following/:userId', authAdditional, async (req, res) => {
	try {
		const loginUser = res.locals.user;
		const print_count = 10;
		const { userId } = req.params;
		const { lastId } = req.query;
		const defaultQuery = Friend.aggregate()
			.project({
				followingId: { $toObjectId: '$followingId' },
				followerId: { $toObjectId: '$followerId' }
			})
			.match({ followingId: mongoose.Types.ObjectId(userId) })
			.sort({ followerId: -1 });
		let friends;
		if (lastId) {
			friends = await defaultQuery
				.match({ followerId: { $lt: mongoose.Types.ObjectId(lastId) } })
				.limit(print_count);
		} else {
			friends = await defaultQuery.limit(print_count);
		}

		const following = await Promise.all(
			friends.map(async (user) => {
				const userInfo = await User.findOne({ _id: user['followerId'] });
				let isFollowing = false;
				if (loginUser) {
					const isFollow = await Friend.findOne({
						followingId: loginUser._id,
						followerId: userInfo._id
					});
					if (isFollow) isFollowing = true;
				}
				return {
					userId: userInfo._id,
					nickname: sanitize(userInfo.nickname),
					profileImg: userInfo.profileImg,
					isFollowing: isFollowing
				};
			})
		);
		return res.send({ following });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

// 팔로워 목록
router.get('/follower/:userId', authAdditional, async (req, res) => {
	try {
		const loginUser = res.locals.user;
		const print_count = 10;
		const { userId } = req.params;
		const { lastId } = req.query;
		const defaultQuery = Friend.aggregate()
			.project({
				followingId: { $toObjectId: '$followingId' },
				followerId: { $toObjectId: '$followerId' }
			})
			.match({ followerId: mongoose.Types.ObjectId(userId) })
			.sort({ followingId: -1 });
		let friends;
		if (lastId) {
			friends = await defaultQuery
				.match({ followingId: { $lt: mongoose.Types.ObjectId(lastId) } })
				.limit(print_count);
		} else {
			friends = await defaultQuery.limit(print_count);
		}

		const follower = await Promise.all(
			friends.map(async (user) => {
				const userInfo = await User.findOne({ _id: user['followingId'] });
				let isFollowing = false;
				// 내가 팔로잉한 사용자인지 체크
				if (loginUser) {
					const isFollow = await Friend.findOne({
						followingId: loginUser._id,
						followerId: userInfo._id
					});
					if (isFollow) isFollowing = true;
				}
				return {
					userId: userInfo._id,
					nickname: sanitize(userInfo.nickname),
					profileImg: userInfo.profileImg,
					isFollowing: isFollowing
				};
			})
		);
		return res.send({ follower });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
