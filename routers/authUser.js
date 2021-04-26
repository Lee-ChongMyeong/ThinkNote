const express = require('express');
const router = express.Router();

// 인증 ^^
router.get("/", (req, res) => {
    const { token } = req.headers
    payload = jwt.verify(token, process.env.LOVE_JWT_SECRET)

    const userInfo = await User.findOne({ _id: payload.userId })

    res.json({
        nickname: req.user.nickname,
        profileImg: req.user.profileImg
    })
})

module.exports = router;