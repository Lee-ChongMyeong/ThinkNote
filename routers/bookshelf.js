const express = require('express');
const { AnswerCard, User, QuestionCard } = require('../models');
const authMiddleware = require('../auth/authMiddleware')
const router = express.Router();
// const QuestionCardSelect = [""]

// 책장 확인
router.get('/books/:YYMM', authMiddleware, async (req, res, next) => {
    const { YYMM } = req.params
    user = res.locals.user;
    const books = await AnswerCard.find({ userId: user.userId, YYMMDD: { $regex: `${YYMM}..` } })
    return res.send({
        books: books
    })
});

// 책장 디테일 확인
router.get('/bookDetail/:YYMMDD', authMiddleware, async (req, res, next) => {
    const { YYMMDD } = req.params
    user = res.locals.user;

    const booksDetail = await AnswerCard.findOne({ userId: user.userId, YYMMDD: YYMMDD })
    const { contents, createdUser } = await QuestionCard.findOne({ _id: booksDetail.questionId })
    const { nickname, profileImg } = await User.findOne({ _id: createdUser })

    return res.send({ booksDetail, questionContents: contents, nickname, profileImg })
});

// 커스텀 질문 등록
router.post('/question', authMiddleware, async (req, res, next) => {
    user = res.locals.user;
    const CustomQuestion = await QuestionCard.create({
        ...req.body,
        createdUser: user.userId
    })
    const { nickname } = await User.findOne({ _id: user.userId })
    return res.send({ CustomQuestion, profileImg: user.profileImg, nickname })
});

module.exports = router;