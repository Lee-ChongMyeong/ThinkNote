const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware')
// 인증 ^^
router.get("/", authMiddleware, (req, res) => {
    user = res.locals.user;

    res.json({
        userId: user.userId,
        nickname: user.nickname,
        profileImg: user.profileImg,
        introduce: user.introduce
    })
})

module.exports = router;
