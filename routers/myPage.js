const express = require('express');
const router = express.Router();
const multer = require('../lib/multer');
const { User } = require('../models');
const authMiddleware = require('../auth/authMiddleware');

router.patch('/profile', authMiddleware, multer.single('profileImg'), async (req, res) => {
	result = { msg: 'success' };
	try {
		if (!req.user || !req.body.nickname) return res.status(400).json({ msg: 'fail' });
		result['nickname'] = req.body.nickname;
		result['myIntro'] = req.body.myIntro;
		result['profileImg'] = req.file.filename;

		console.log(result);
		res.json({ msg: 'success' });
	} catch {
		res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
