const express = require('express');
const router = express.Router();
const multer = require('../lib/multer');
const { User } = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const sanitize = require('sanitize-html')

router.patch('/profile/defaultImg', authMiddleware, (req, res) => {
	try {
		const user = res.locals.user;
		user.profileImg = 'https://blog.kakaocdn.net/dn/cyOIpg/btqx7JTDRTq/1fs7MnKMK7nSbrM9QTIbE1/img.jpg';
		user.save();
		res.json({ profileImg: user.profileImg });
	} catch {
		res.status(400).json({ msg: 'fail' });
	}
});

router.patch('/profile/profileImg', authMiddleware, multer.single('profileImg'), async (req, res) => {
	try {
		const user = res.locals.user;
		user.profileImg = req.file.filename
		user.save();
		res.json({ profileImg: user.profileImg });
	} catch {
		res.status(400).json({ msg: 'fail' });
	}
});

router.patch('/profile/nickname', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		const nickname = sanitize(req.body.nickname);
		if (2 > nickname.length || 12 < nickname.length)
			return res.status(400).json({ msg: `Please check nickname length` });
		User.findOne({ nickname })
			.then((result) => {
				if (result || !nickname) {
					res.status(400).json({ msg: 'fail' });
				} else {
					user.nickname = nickname;
					user.save();
					res.json({ nickname: user.nickname });
				}
		})
	} catch {
		console.log('에러')
		res.status(400).json({ msg: 'fail' });
	}
});


router.patch('/profile/introduce', authMiddleware, (req, res) => {
	try {
		const user = res.locals.user;
		user.introduce = sanitize(req.body.introduce);
		user.save();
		res.json({ introduce: user.introduce });
	} catch {
		res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
