const express = require('express');
const { AnswerCard, User, QuestionCard, Friend, Like, Alarm } = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const router = express.Router();

// const { alarm } = require('../app')

// 유저 검색
// 알파벳 대문자 소문자
router.post('/searchUser', async (req, res, next) => {
    console.log('힝')
    try {
        const { words } = req.body;
        if (!words) { res.send({ userInfo: 'none' }) }
        // ({ userId: { $ne: user.userId }, questionId: questionId })
        const userInfo = await User.find({ nickname: { $ne: '대호리' }, nickname: new RegExp(`${words}`) }, { createdAt: 0, updatedAt: 0, provider: 0, socialId: 0 })

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
router.get('/other/books/:YYMM/:id', authMiddleware, async (req, res, next) => {
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
            const likeCount = await Like.find({ answerId: booksDetail[i]['_id'] })
            const likeCountNum = likeCount.length
            booksDiary.push({
                questionId: _id,
                questionCreatedUserId: questionUserInfo._id,
                questionCreatedUserNickname: questionUserInfo.nickname,
                questionCreatedUserProfileImg: questionUserInfo.profileImg,
                questionContents: contents,
                answerContents: booksDetail[i]['contents'],
                answerUserNickname: user.nickname,
                isOpen: booksDetail[i]['isOpen'],
                likeCount: likeCountNum
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
            const likeCount = await Like.find({ answerId: booksDetail[i]['_id'] })
            const likeCountNum = likeCount.length
            booksDiary.push({
                questionId: _id,
                questionCreatedUserId: questionUserInfo._id,
                questionCreatedUserNickname: questionUserInfo.nickname,
                questionCreatedUserProfileImg: questionUserInfo.profileImg,
                questionContents: contents,
                answerContents: booksDetail[i]['contents'],
                answerUserNickname: user.nickname,
                isOpen: booksDetail[i]['isOpen'],
                likeCount: likeCountNum
            })
        }
        return res.send({ booksDiary })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 내 질문 카드 디테일 확인
// 날짜 작성 보여주기
router.get('/bookCardDetail/:YYMMDD/:questionId', authMiddleware, async (req, res, next) => {
    try {
        const { YYMMDD, questionId } = req.params;
        user = res.locals.user;
        bookCardDetail = []
        other = []
        const booksDetail = await AnswerCard.findOne({ userId: user.userId, YYMMDD: YYMMDD })
        const { contents, createdUser, topic } = await QuestionCard.findOne({ _id: questionId })
        const questionUserInfo = await User.findOne({ _id: createdUser })
        // const others = await AnswerCard.find({ userId: { $ne: user.userId }, questionId: questionId }).limit(3)

        const likeCount = await Like.find({ answerId: booksDetail['_id'] })
        const likeCountNum = likeCount.length

        bookCardDetail.push({
            questionCreatedUserId: questionUserInfo._id,
            questionCreatedUserNickname: questionUserInfo.nickname,
            questionCreatedUserProfileImg: questionUserInfo.profileImg,
            questionTopic: topic,
            questionContents: contents,
            answerContents: booksDetail.contents,
            answerUserNickname: user.nickname,
            isOpen: booksDetail.isOpen,
            likeCount: likeCountNum
        })
        return res.send({ bookCardDetail, other })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 다른 사람 질문 카드 디테일 확인
router.get('/other/bookCardDetail/:YYMMDD/:questionId/:id', authMiddleware, async (req, res, next) => {
    try {
        const { YYMMDD, questionId, id } = req.params;
        bookCardDetail = []
        other = []
        const booksDetail = await AnswerCard.findOne({ userId: id, YYMMDD: YYMMDD });
        const { contents, createdUser, topic } = await QuestionCard.findOne({ _id: questionId });
        const questionUserInfo = await User.findOne({ _id: createdUser });

        const likeCount = await Like.find({ answerId: booksDetail['_id'] });
        const likeCountNum = likeCount.length;

        bookCardDetail.push({
            questionCreatedUserId: questionUserInfo._id,
            questionCreatedUserNickname: questionUserInfo.nickname,
            questionCreatedUserProfileImg: questionUserInfo.profileImg,
            questionTopic: topic,
            questionContents: contents,
            answerContents: booksDetail.contents,
            answerUserNickname: user.nickname,
            isOpen: booksDetail.isOpen,
            likeCount: likeCountNum
        })
        return res.send({ bookCardDetail, other })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 커스텀 질문 등록
// 질문 하루에 1개만 하기 바꾸기
router.post('/question', authMiddleware, async (req, res, next) => {
    try {
        const { contents, topic } = req.body;
        const originContents = await QuestionCard.findOne({ contents: contents })

        if (!topic) {
            return res.send({ msg: '토픽을 넣어주세요' })
        }

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
        const checkFriend = await Friend.findOne({ followingId: user.userId, followerId: friendId })
        if (checkFriend) { return res.send('이미 친구입니다.') }

        const addfriend = await Friend.create({
            followingId: user.userId,
            followerId: friendId
        })
        return res.status(200).json({ msg: '친구추가 성공' })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 친구해제ㅠㅠ
router.delete('/friend', authMiddleware, async (req, res, next) => {
    try {
        user = res.locals.user;
        const { friendId } = req.body;
        const checkFriend = await Friend.findOne({ followingId: user.userId, followerId: friendId })
        if (!checkFriend) { return res.send('친구가 아닙니다.') }
        await Friend.deleteOne({ followingId: user.userId, followerId: friendId })
        return res.json({ msg: '친구삭제 성공' })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 내 친구 목록 확인
// 무한 스크롤 추가 하기
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
    try {
        const { id } = req.params;
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

// 답변카드 좋아요 클릭
router.post('/like/answerCard', authMiddleware, async (req, res, next) => {
    try {
        const { answerCardId } = req.body;
        user = res.locals.user;
        const currentLike = await Like.findOne({ userId: user.userId, answerId: answerCardId })
        const answer = await AnswerCard.findOne({ answerId: answerCardId })
        if (currentLike) { return res.send('이미 좋아요 누른 상태') }

        await Like.create({
            answerId: answerCardId,
            userId: user.userId
        })

        const likeCount = await Like.find({ answerId: answerCardId })
        const likeCountNum = likeCount.length
        console.log(likeCountNum)

        let AlarmInfo = await Alarm.findOne({ userId: answer.userId, cardId: answerCardId })

        if (!AlarmInfo) {
            const AlarmInfo = await Alarm.create({
                userId: answer.userId,
                userList: [user.userId],
                cardId: answerCardId,
                eventType: 'like',
            })
        } else {
            AlarmInfo['userList'].push(user.userId)
            await AlaramInfo.save()
        }
        // 앤써카드의 주인 찾아서
        alarm.to(answer.userId).emit("AlarmEvent", {
            alarmId: AlarmInfo._id,
            userId: AlarmInfo.userId,
            recentNickname: user.nickname,
            cardId: answerCardId,
            eventType: 'like',
            checked: true,
            time: AlarmInfo.updatedAt
        })

        return res.send({ answerCardId, likeCountNum, currentLike: true })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
})

// 답변카드 좋아요 취소 클릭
router.patch('/like/answerCard', authMiddleware, async (req, res, next) => {
    try {
        const { answerCardId } = req.body;
        user = res.locals.user;
        console.log('1')

        const currentLike = await Like.findOne({ userId: user.userId, answerId: answerCardId })
        if (!currentLike) { return res.send('좋아요가 안되어있는데 어떻게 좋아요를 취소합니까 아시겠어여?') }

        await Like.deleteOne({ answerId: answerCardId, userId: user.userId })
        await AnswerCard.findOne({ answerId: answerCardId, userId: user.userId })
        console.log('2')

        const likeCount = await Like.find({ answerId: answerCardId })
        console.log(likeCount)
        const likeCountNum = likeCount.length
        console.log(likeCountNum)
        return res.send({ answerCardId, likeCountNum, currentLike: false })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
})

//더보기 질문 타이틀
router.get('/moreInfoCardTitle/:questionId', async (req, res, next) => {
    try {
        const { questionId } = req.params;
        const questionInfo = await QuestionCard.findOne({ _id: questionId })
        const userInfo = await User.findOne({ _id: questionInfo.userId })

        return res.send({
            questionId: questionInfo._id,
            questionContents: questionInfo.contents,
            questionCreatedUserId: userInfo._id,
            questionCreatedUserNickname: userInfo.nickname,
            questionCreatedUserProfileImg: userInfo.profileImg
        })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
})

// 더보기 답변들
// 기본 내려주기
router.get('/moreInfoCard/:questionId', async (req, res, next) => {
    try {
        let { page } = req.query
        page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0

        const { questionId } = req.params;
        const allAnswer = await AnswerCard.find({ questionId }).skip(page * 2).limit(2);

        answer = []
        for (let i = 0; i < allAnswer.length; i++) {
            const UserInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
            answer.push({
                userId: UserInfo._id,
                userNickname: UserInfo.nickname,
                userProfileImg: UserInfo.profileImg,
                answerId: allAnswer[i]['_id'],
                answerContents: allAnswer[i]['contents']
            })
        }
        return res.send({ answer })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
})

// 더보기 답변들
// 좋아요 순위
router.get('/moreInfoCard/like/:questionId', async (req, res, next) => {
    try {
        let { page } = req.query
        page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0

        const { questionId } = req.params;
        const { } = await AnswerCard.find({ questionId }).sort().skip(page * 2).limit(2)

        answer = []
        for (let i = 0; i < allAnswer.length; i++) {
            const UserInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
            answer.push({
                userId: UserInfo._id,
                userNickname: UserInfo.nickname,
                userProfileImg: UserInfo.profileImg,
                answerId: allAnswer[i]['_id'],
                answerContents: allAnswer[i]['contents']
            })
        }
        return res.send({ answer })
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
})

router.get('/cards/:questionId/test', async (req, res) => {
    const { questionId } = req.params;
    const answers = await AnswerCard.find({ questionId });
    let answerList = [];
    for (answer of answers) answerList.push(answer._id);
    let likes = await Like.find().where('answerId').in(answerList);
    countLike = {};
    for (element of likes) {
        if (!countLike[element.answerId]) countLike[element.answerId] = 1;
        else countLike[element.answerId] += 1;
    }
    mostLike = [];
    for (key in countLike) mostLike.push({ answerId: key, count: countLike[key] });
    mostLike.sort((a, b) => {
        return a.count - b.count;
    });
    res.json({ mostLike });
});

//커스텀 질문조회
router.get('/question', authMiddleware, async (req, res, next) => {
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

module.exports = router;
