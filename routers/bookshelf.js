const express = require('express');
const { AnswerCard } = require('../models');
const authMiddleware = require('../auth/authMiddleware')
const router = express.Router();

// 책장 확인
router.post('/books/:YYMM', authMiddleware, async (req, res, next) => {
    const { YYMM } = req.params
    user = res.locals.user;

    const books = await AnswerCard.find({ _id: user.userId, YYMMDD: { $regex: `${YYMM}..` } })
    return res.send({
        books: books
    })
});

// 책장 디테일 확인
router.get('/bookDetail/:YYMMDD', async (req, res, next) => {
    const { YYMMDD } = req.params
    user = res.locals.user;

    const booksDetail = await AnswerCard.find({ _id: user.userId, YYMMDD: YYMMDD })
    return res.send({
        booksDetail: booksDetail
    })
});

// 질문 등록
router.post('/question', authMiddleware, async (req, res, next) => {
    user = res.locals.user;
    const createdUser:

        const books = await AnswerCard.find({ YYMMDD: YYMMDD })
    return res.send({
        books: books
    })
});

module.exports = router;
