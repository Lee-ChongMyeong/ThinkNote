/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const { User, Friend } = require('../models');
const sanitize = require('../lib/sanitizeHtml');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');
require('dotenv').config();

// 팔로잉 목록
router.get('/following/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const friends = await Friend.find({ followingId: userId }).sort('-createdAt');
		const following = await Promise.all(
			friends.map(async (user) => {
				const userInfo = await User.findOne({ _id: user['followerId'] });
				return {
					userId: userInfo._id,
					nickname: sanitize(userInfo.nickname),
					profileImg: userInfo.profileImg
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
router.get('/follower/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const friends = await Friend.find({ followerId: userId }).sort('-createdAt');
		const follower = await Promise.all(
			friends.map(async (user) => {
				const userInfo = await User.findOne({ _id: user['followingId'] });
				return {
					userId: userInfo._id,
					nickname: sanitize(userInfo.nickname),
					profileImg: userInfo.profileImg
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
