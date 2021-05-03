const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware')
const { AnswerCard, QuestionCard } = require('../models');
// 인증 ^^
router.get("/", authMiddleware, async (req, res) => {
    user = res.locals.user;
    const myQuestion = await QuestionCard.find({ createdUser: user.userId });
    const myAnswer = await AnswerCard.find({ userId: user.userId });
    res.json({
        userId: user.userId,
        nickname: user.nickname,
        profileImg: user.profileImg,
        introduce: user.introduce,
        myCustomQuestionCount: myQuestion.length,
        myAnswerCount: myAnswer.length
    })
})

module.exports = router;