const express = require('express');
const { AnswerCard, User, QuestionCard, Friend } = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const router = express.Router();

// 유저 검색
// 알파벳 대문자 소문자
router.post('/searchUser', async (req, res, next) => {
    try {
        const { words } = req.body;
        if (!words) { res.send({ userInfo: 'none' }) }
        const userInfo = await User.find({ nickname: new RegExp(`${words}`) }, { createdAt: 0, updatedAt: 0, provider: 0, socialId: 0 })
        if (userInfo) {
            res.send({ userInfo })
        }
        else {
            res.send({ userInfo: 'none' })
        }
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
})

// 다른 사람 책장 & 페이지 들어갈 때 정보 확인
// 친구인지 아닌지
router.get('/auth/user/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const UserInfo = await User.findOne({ _id: id });
        res.json({
            nickname: UserInfo.nickname,
            profileImg: UserInfo.profileImg,
            introduce: UserInfo.introduce
        })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 내 책장 월별 확인
router.get('/books/:YYMM', authMiddleware, async (req, res, next) => {
    try {
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
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 다른 사람 책장 월별 확인
router.get('/other/books/:YYMMDD/:id', authMiddleware, async (req, res, next) => {
    try {
        const { YYMM } = req.params;
        const { id } = req.params;
        const books = await AnswerCard.aggregate([
            { $match: { userId: id, YYMMDD: { $regex: `${YYMM}..` } } },
            { $group: { _id: "$YYMMDD", count: { $sum: 1 } } }
        ]).sort({ _id: '-1' })
        return res.send({
            books: books
        })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 내 책장 일별 확인
router.get('/bookDetail/:YYMMDD', authMiddleware, async (req, res, next) => {
    try {
        const { YYMMDD } = req.params
        user = res.locals.user;

        const booksDetail = await AnswerCard.find({ userId: user.userId, YYMMDD: YYMMDD })
        booksDiary = []

        for (let i = 0; i < booksDetail.length; i++) {
            const { contents, createdUser, _id } = await QuestionCard.findOne({ _id: booksDetail[i]['questionId'] })
            const questionUserInfo = await User.findOne({ _id: createdUser })
            booksDiary.push({
                questionId: _id,
                questionCreatedUserId: questionUserInfo._id,
                questionCreatedUser: questionUserInfo.nickname,
                questionCreatedUserProfileImg: questionUserInfo.profileImg,
                questionContents: contents,
                answerContents: booksDetail[i]['contents'],
                answerUser: user.nickname,
                isOpen: booksDetail[i]['isOpen'],
            })
        }
        return res.send({ booksDiary })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 다른 사람 책장 일별 확인
router.get('/other/bookDetail/:YYMMDD/:id', authMiddleware, async (req, res, next) => {
    try {
        const { YYMMDD } = req.params;
        const { id } = req.params;
        const booksDetail = await AnswerCard.find({ userId: id, YYMMDD: YYMMDD })
        booksDiary = []
        for (let i = 0; i < booksDetail.length; i++) {
            const { contents, createdUser, _id } = await QuestionCard.findOne({ _id: booksDetail[i]['questionId'] })
            const questionUserInfo = await User.findOne({ _id: createdUser })
            booksDiary.push({
                questionId: _id,
                questionCreatedUserId: questionUserInfo._id,
                questionCreatedUserNickname: questionUserInfo.nickname,
                questionCreatedUserProfileImg: questionUserInfo.profileImg,
                questionContents: contents,
                answerContents: booksDetail[i]['contents'],
                answerUserNickname: user.nickname,
                isOpen: booksDetail[i]['isOpen'],
            })
        }
        return res.send({ booksDiary })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 내 질문 카드 디테일 확인
router.get('/bookCardDetail/:YYMMDD/:questionId', authMiddleware, async (req, res, next) => {
    try {
        const { YYMMDD } = req.params
        user = res.locals.user;
        bookCardDetail = []
        other = []
        const booksDetail = await AnswerCard.findOne({ userId: user.userId, YYMMDD: YYMMDD })
        const { contents, createdUser, _id } = await QuestionCard.findOne({ _id: booksDetail.questionId })
        const questionUserInfo = await User.findOne({ _id: createdUser })
        const others = await AnswerCard.find({ userId: { $ne: user.userId }, questionId: _id }).limit(3)

        for (let i = 0; i < others.length; i++) {
            const otherUserInfo = await User.findOne({ _id: others[i]['userId'] })
            other.push({
                otherUserId: others[i]['userId'],
                otherUserNickname: otherUserInfo.nickname,
                otherUserContents: others[i]['contents'],
                otherUserProfileImg: otherUserInfo.profileImg
            })
        }

        bookCardDetail.push({
            questionCreatedUserId: questionUserInfo._id,
            questionCreatedUserNickname: questionUserInfo.nickname,
            questionCreatedUserProfileImg: questionUserInfo.profileImg,
            questionContents: contents,
            answerContents: booksDetail.contents,
            answerUserNickname: user.nickname,
            isOpen: booksDetail.isOpen,
        })
        return res.send({ bookCardDetail, other })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 커스텀 질문 등록
// 중복 제거하기
router.post('/question', authMiddleware, async (req, res, next) => {
    try {

        const { contents } = req.body;
        const originContents = await QuestionCard.findOne({ contents: contents })

        if (!originContents) {
            user = res.locals.user;
            const CustomQuestion = await QuestionCard.create({ ...req.body, createdUser: user.userId })
            const { nickname } = await User.findOne({ _id: user.userId })
            return res.send({ CustomQuestion, profileImg: user.profileImg, nickname })
        } else {
            return res.send({ msg: '이미 존재하는 질문입니다' })
        }

    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 친구 추가
router.post('/addfriend', authMiddleware, async (req, res, next) => {
    try {
        user = res.locals.user;
        const { friendId } = req.body;
        const addfriend = await Friend.create({
            followingId: user.userId,
            followerId: friendId
        })
        return res.send('친구추가 성공')
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 내 친구 목록 확인
// 무한 스크롤 하기 // 친구 삭제 추가 관련 부분
router.get('/friendList', authMiddleware, async (req, res, next) => {
    try {
        user = res.locals.user;
        const friendList = await Friend.find({ followingId: user.userId })
        friends = []
        for (let i = 0; i < friendList.length; i++) {
            const friendInfo = await User.findOne({ _id: friendList[i]['followerId'] })
            friends.push({
                friendId: friendInfo._id,
                friendNickname: friendInfo.nickname,
                friendProfileImg: friendInfo.profileImg
            })
        }
        return res.send({ friends })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 타인의 친구 목록
router.get('/other/friendList/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const friendList = await Friend.find({ followingId: id })
        othersFriend = []
        for (let i = 0; i < friendList.length; i++) {
            const friendInfo = await User.findOne({ _id: friendList[i]['followerId'] })
            othersFriend.push({
                otherFriendId: friendInfo._id,
                otherFriendNickname: friendInfo.nickname,
                otherFriendProfileImg: friendInfo.profileImg
            })
        }
        return res.send({ othersFriend })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

module.exports = router;