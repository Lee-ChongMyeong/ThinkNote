const express = require('express');
const { AnswerCard, User, QuestionCard } = require('../models');
const authMiddleware = require('../auth/authMiddleware')
const router = express.Router();

// 유저 검색
// 알파벳 대문자 소문자
router.post('/searchUser', async (req, res, next) => {
    const { words } = req.body;
    if (!words) { res.send({ userInfo: 'none' }) }
    const userInfo = await User.find({ nickname: new RegExp(`${words}`) }, { createdAt: 0, updatedAt: 0, provider: 0, socialId: 0 })
    if (userInfo) {
        res.send({ userInfo })
    }
    else {
        res.send({ userInfo: 'none' })
    }
})

// 내 책장 월별 확인
router.get('/books/:YYMM', authMiddleware, async (req, res, next) => {
    const { YYMM } = req.params
    user = res.locals.user;
    // const { YYMMDD } = await AnswerCard.aggregate({ userId: user.userId, YYMMDD: { $regex: `${YYMM}..` } })
    const books = await AnswerCard.aggregate([
        { $match: { userId: user.userId, YYMMDD: { $regex: `${YYMM}..` } } },
        { $group: { _id: "$YYMMDD", count: { $sum: 1 } } }
    ]).sort({ _id: '-1' })
    return res.send({
        books: books
    })
});

// // 다른 사람 책장 들어갈 떄 유저 정보 확인
// router.get('/books/:YYMM', authMiddleware, async (req, res, next) => {
//     console.log('인증 시작')
//     user = res.locals.user;
//     res.json({
//         nickname: user.nickname,
//         profileImg: user.profileImg,
//         introduce: user.introduce
//     })
// });

// 내 책장 일별 확인
router.get('/bookDetail/:YYMMDD', authMiddleware, async (req, res, next) => {
    const { YYMMDD } = req.params
    user = res.locals.user;

    const booksDetail = await AnswerCard.find({ userId: user.userId, YYMMDD: YYMMDD })
    console.log({ booksDetail })
    booksDiary = []

    for (let i = 0; i < booksDetail.length; i++) {
        const { contents, createdUser } = await QuestionCard.findOne({ _id: booksDetail[i]['questionId'] })
        const answerUserInfo = await User.findOne({ _id: createdUser })
        booksDiary.push({
            questionContents: contents,
            questionCreatedUser: answerUserInfo.nickname,
            questionCreatedUserProfileImg: answerUserInfo.profileImg,
            answerContents: booksDetail[i]['contents'],
            answerUser: user.nickname,
            isOpen: booksDetail[i]['isOpen']
        })
    }
    return res.send({ booksDiary })
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