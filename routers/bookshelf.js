const express = require('express');
const { AnswerCard } = require('../models');
const router = express.Router();

// 책장 확인
router.post('/books/:YYMM', async (req, res, next) => {
    const { YYMM } = req.params
    // 유저 누군지 찾기
    //정규 표현식
    const books = await AnswerCard.find({ YYMMDD: { $regex: `${YYMM}..` } })
    return res.send({
        books: books
    })
});

// 책장 디테일 확인
router.post('/bookDetail/:YYMMDD', async (req, res, next) => {
    const { YYMMDD } = req.params
    // 유저 누군지 찾기
    //정규 표현식
    const books = await AnswerCard.find({ YYMMDD: YYMMDD })
    return res.send({
        books: books
    })
});

module.exports = router;
