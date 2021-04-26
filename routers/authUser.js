const express = require('express');
const router = express.Router();

// 인증 ^^
router.get("/", (req, res) => {
    console.log(req.user)
    res.json({
        nickname: req.user.nickname,
        profileImg: req.user.profileImg

    })
})

module.exports = router;
