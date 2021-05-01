const express = require('express');
const { AnswerCard, User, QuestionCard, Friend, Like, Alarm, CommentBoard } = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const router = express.Router();
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

// 유저 검색
// 알파벳 대문자 소문자
router.post('/searchUser', async (req, res, next) => {
    try {
        const { words } = req.body;
        if (!words) {
            res.send({ userInfo: 'none' });
        }
        // ({ userId: { $ne: user.userId }, questionId: questionId })
        const userInfo = await User.find({ nickname: { $ne: "알 수 없는 유저" }, nickname: new RegExp(`${words}`) }, { createdAt: 0, updatedAt: 0, provider: 0, socialId: 0 });
        if (userInfo) {
            res.send({ userInfo });
        } else {
            res.send({ userInfo: 'none' });
        }
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

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
        });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 내 책장 월별 확인
router.get('/books/:YYMM', authMiddleware, async (req, res, next) => {
    try {
        const { YYMM } = req.params;
        user = res.locals.user;
        const books = await AnswerCard.aggregate([
            { $match: { userId: user.userId, YYMMDD: { $regex: `${YYMM}..` } } },
            { $group: { _id: '$YYMMDD', count: { $sum: 1 } } }
        ]).sort({ _id: '-1' });
        return res.send({
            books: books
        });
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
            { $group: { _id: '$YYMMDD', count: { $sum: 1 } } }
        ]).sort({ _id: '-1' });
        return res.send({
            books: books
        });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 내 책장 일별 확인
router.get('/bookDetail/:YYMMDD', authMiddleware, async (req, res, next) => {
    try {
        const { YYMMDD } = req.params;
        user = res.locals.user;

        const booksDetail = await AnswerCard.find({ userId: user.userId, YYMMDD: YYMMDD });
        booksDiary = [];

        for (let i = 0; i < booksDetail.length; i++) {
            const { contents, createdUser, _id } = await QuestionCard.findOne({ _id: booksDetail[i]['questionId'] });
            const questionUserInfo = await User.findOne({ _id: createdUser });
            let commentCount = await CommentBoard.find({ cardId: booksDetail[i].answerId });
            const likeCount = await Like.find({ answerId: booksDetail[i]['_id'] });
            const likeCountNum = likeCount.length;
            booksDiary.push({
                questionId: _id,
                questionCreatedUserId: questionUserInfo._id,
                questionCreatedUserNickname: questionUserInfo.nickname,
                questionCreatedUserProfileImg: questionUserInfo.profileImg,
                questionContents: contents,
                answerContents: booksDetail[i]['contents'],
                answerUserNickname: user.nickname,
                isOpen: booksDetail[i]['isOpen'],
                likeCount: likeCountNum,
                commentCount: commentCount.length
            });
        }
        return res.send({ booksDiary });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 다른 사람 책장 일별 확인
router.get('/other/bookDetail/:YYMMDD/:id', authMiddleware, async (req, res, next) => {
    try {
        const { YYMMDD } = req.params;
        const { id } = req.params;
        const booksDetail = await AnswerCard.find({ userId: id, YYMMDD: YYMMDD });
        booksDiary = [];
        for (let i = 0; i < booksDetail.length; i++) {
            const { contents, createdUser, _id } = await QuestionCard.findOne({ _id: booksDetail[i]['questionId'] });
            const questionUserInfo = await User.findOne({ _id: createdUser });
            const likeCount = await Like.find({ answerId: booksDetail[i]['_id'] });
            const likeCountNum = likeCount.length;
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
            });
        }
        return res.send({ booksDiary });
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
        bookCardDetail = [];
        other = [];
        const booksDetail = await AnswerCard.findOne({ userId: user.userId, YYMMDD: YYMMDD });
        const { contents, createdUser, topic } = await QuestionCard.findOne({ _id: questionId });
        const questionUserInfo = await User.findOne({ _id: createdUser });
        // const others = await AnswerCard.find({ userId: { $ne: user.userId }, questionId: questionId }).limit(3)

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
        });
        return res.send({ bookCardDetail, other });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 다른 사람 질문 카드 디테일 확인
router.get('/other/bookCardDetail/:YYMMDD/:questionId/:id', authMiddleware, async (req, res, next) => {
    try {
        const { YYMMDD, questionId, id } = req.params;
        bookCardDetail = [];
        other = [];
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
        });
        return res.send({ bookCardDetail, other });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 커스텀 질문 등록
router.post('/question', authMiddleware, async (req, res, next) => {
    try {
        user = res.locals.user;
        const { contents, topic } = req.body;

        // 하루에 1번 질문할 수 있는것 체크
        let { createdAt } = await QuestionCard.findOne({ createdUser: user.userId }).sort("-createdAt");
        const createdAtTypeChangeString = JSON.stringify(createdAt);
        let checkTodayCustomQuestion = createdAtTypeChangeString.split("T");
        let Today = moment().format('"YYYY-MM-DD');

        if (Today === checkTodayCustomQuestion[0]) {
            return res.status(400).send({ msg: '오늘은 이미 질문을 남겼어요. 힝 아쉽지만 다음에' })
        }

        // 토픽 없을때 빠꾸
        if (!topic) {
            return res.status(400).send({ msg: '토픽을 넣어주세요' });
        }

        // 이미 있는 질문인지 검사
        const originContents = await QuestionCard.findOne({ contents: contents });
        if (!originContents) {
            const CustomQuestion = await QuestionCard.create({ ...req.body, createdUser: user.userId });
            const { nickname } = await User.findOne({ _id: user.userId });
            return res.send({ CustomQuestion, profileImg: user.profileImg, nickname });
        } else {
            return res.send({ msg: '이미 존재하는 질문입니다' });
        }
    } catch (err) {
        console.log(err)
        return res.status(400).json({ msg: 'fail' });
    }
});

// 친구 추가
router.post('/addfriend', authMiddleware, async (req, res, next) => {
    try {
        user = res.locals.user;
        const { friendId } = req.body;
        const checkFriend = await Friend.findOne({ followingId: user.userId, followerId: friendId });
        if (checkFriend) {
            return res.send('이미 친구입니다.');
        }

        const addfriend = await Friend.create({
            followingId: user.userId,
            followerId: friendId
        });
        return res.status(200).json({ msg: '친구추가 성공' });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 친구해제ㅠㅠ
router.delete('/friend', authMiddleware, async (req, res, next) => {
    try {
        user = res.locals.user;
        const { friendId } = req.body;
        const checkFriend = await Friend.findOne({ followingId: user.userId, followerId: friendId });
        if (!checkFriend) {
            return res.send('친구가 아닙니다.');
        }
        await Friend.deleteOne({ followingId: user.userId, followerId: friendId });
        return res.json({ msg: '친구삭제 성공' });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 내 친구 목록 확인
// 무한 스크롤 추가 하기
router.get('/friendList', authMiddleware, async (req, res, next) => {
    try {
        user = res.locals.user;
        const friendList = await Friend.find({ followingId: user.userId });
        friends = [];
        for (let i = 0; i < friendList.length; i++) {
            const friendInfo = await User.findOne({ _id: friendList[i]['followerId'] });
            friends.push({
                friendId: friendInfo._id,
                friendNickname: friendInfo.nickname,
                friendProfileImg: friendInfo.profileImg
            });
        }
        return res.send({ friends });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 타인의 친구 목록
router.get('/other/friendList/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const friendList = await Friend.find({ followingId: id });
        othersFriend = [];
        for (let i = 0; i < friendList.length; i++) {
            const friendInfo = await User.findOne({ _id: friendList[i]['followerId'] });
            othersFriend.push({
                otherFriendId: friendInfo._id,
                otherFriendNickname: friendInfo.nickname,
                otherFriendProfileImg: friendInfo.profileImg
            });
        }
        return res.send({ othersFriend });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 답변카드 좋아요 클릭
router.post('/like/answerCard', authMiddleware, async (req, res, next) => {
    try {
        const { answerCardId } = req.body;
        user = res.locals.user;
        console.log('0');
        const currentLike = await Like.findOne({ userId: user.userId, answerId: answerCardId });
        const answer = await AnswerCard.findOne({ _id: answerCardId });
        if (currentLike) {
            return res.send('이미 좋아요 누른 상태');
        }
        // 새로고침하고 커뮤니티왔을 때 그때 좋아요가 되있는걸 취소했을 떄,
        // 
        console.log('1');
        await Like.create({
            answerId: answerCardId,
            userId: user.userId
        });
        console.log('2');
        const likeCount = await Like.find({ answerId: answerCardId });
        const likeCountNum = likeCount.length;

        const alarmSend = require('../lib/sendAlarm');
        await alarmSend(answer.userId, answerCardId, 'like', user.userId, req.alarm);

        return res.send({ answerCardId, likeCountNum, currentLike: true });
    } catch (err) {
        console.log(err);
        return res.status(400).json({ msg: 'fail' });
    }
});

// 답변카드 좋아요 취소 클릭
router.patch('/like/answerCard', authMiddleware, async (req, res, next) => {
    try {
        const { answerCardId } = req.body;
        user = res.locals.user;

        const currentLike = await Like.findOne({ userId: user.userId, answerId: answerCardId });
        if (!currentLike) {
            return res.send('좋아요가 안되어있는데 어떻게 좋아요를 취소합니까 아시겠어여?');
        }

        await Like.deleteOne({ answerId: answerCardId, userId: user.userId });
        let answer = await AnswerCard.findOne({ _id: answerCardId });

        const likeCount = await Like.find({ answerId: answerCardId });
        const likeCountNum = likeCount.length;

        let alarmInfo = await Alarm.findOne({ userId: answer.userId, cardId: answerCardId, eventType: 'like' });
        if (alarmInfo['userList'] && (-1 != alarmInfo['userList'].indexOf(user._id))) {
            await Alarm.deleteOne({ userId: answer.userId, cardId: answerCardId, eventType: 'like' });
        } else {
            alarmInfo['userList'].splice(alarmInfo['userList'].indexOf(user._id), 1);
            await alarmInfo.save();
        }

        res.send({ answerCardId, likeCountNum, currentLike: false });
        return;
    } catch (err) {
        console.log(err);
        return res.status(400).json({ msg: 'fail' });
    }
});

//더보기 질문 타이틀
router.get('/moreInfoCardTitle/:questionId', async (req, res, next) => {
    try {
        const { questionId } = req.params;
        const questionInfo = await QuestionCard.findOne({ _id: questionId });
        const userInfo = await User.findOne({ _id: questionInfo.userId });

        return res.send({
            questionId: questionInfo._id,
            questionContents: questionInfo.contents,
            questionCreatedUserId: userInfo._id,
            questionCreatedUserNickname: userInfo.nickname,
            questionCreatedUserProfileImg: userInfo.profileImg
        });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 더보기 답변들
// 기본 내려주기
router.get('/moreInfoCard/:questionId', async (req, res, next) => {
    try {
        let { page } = req.query;
        page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

        const { questionId } = req.params;
        const allAnswer = await AnswerCard.find({ questionId })
            .skip(page * 2)
            .limit(2);

        answer = [];
        for (let i = 0; i < allAnswer.length; i++) {
            const UserInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
            answer.push({
                userId: UserInfo._id,
                userNickname: UserInfo.nickname,
                userProfileImg: UserInfo.profileImg,
                answerId: allAnswer[i]['_id'],
                answerContents: allAnswer[i]['contents']
            });
        }
        return res.send({ answer });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 더보기 답변들
// 좋아요 순위
// 친구가 쓴 것만
router.get('/moreInfoCard/like/:questionId', async (req, res, next) => {
    try {
        let { page } = req.query;
        page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;
        const { questionId } = req.params;
        const allAnswer = await AnswerCard.find({ questionId })
            .sort()
            .skip(page * 2)
            .limit(2);

        answer = [];
        for (let i = 0; i < allAnswer.length; i++) {
            const UserInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
            answer.push({
                userId: UserInfo._id,
                userNickname: UserInfo.nickname,
                userProfileImg: UserInfo.profileImg,
                answerId: allAnswer[i]['_id'],
                answerContents: allAnswer[i]['contents']
            });
        }
        return res.send({ answer });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 좋아요순위 나중에이용할것
router.get('/cards/:questionId/test', async (req, res) => {
    const { questionId } = req.params;
    const answers = await AnswerCard.find({ questionId });
    let answerList = [];
    for (answer of answers) answerList.push(answer._id);
    let likes = await Like.find().where('answerId').in(answerList)
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

//내 커스텀 카드 질문조회
router.get('/question', authMiddleware, async (req, res, next) => {
    try {
        user = res.locals.user;
        let { page } = req.query;
        page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;
        const myCustomQuestionCard = await QuestionCard.find({ createdUser: user.userId })
            .skip(page * 2)
            .limit(2);
        myQuestion = [];

        for (let i = 0; i < myCustomQuestionCard.length; i++) {
            let answerData = await AnswerCard.find({ questionId: myCustomQuestionCard[i]['_id'], isOpen: true });
            if (!answerData) {
                answerData = 0;
            }
            myQuestion.push({
                // createdUserId: user.userId,
                // createdUserNickname: user.nickname,
                // createdUserProfileImg: user.profileImg,
                questionId: myCustomQuestionCard[i]['_id'],
                questionContents: myCustomQuestionCard[i]['contents'],
                questionTopic: myCustomQuestionCard[i]['topic'],
                questionCreatedAt: myCustomQuestionCard[i]['createdAt'],
                answerCount: answerData.length
            });
            //질문에 몇명답했는지
        }
        return res.send({ myQuestion });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

//다른 사람 커스텀 카드 질문조회
router.get('/other/:id/question', authMiddleware, async (req, res, next) => {
    console.log('하이')
    try {
        let { page } = req.query;
        const { id } = req.params;
        page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;
        const otherCustomQuestionCard = await QuestionCard.find({ createdUser: id })
            .skip(page * 2)
            .limit(2);
        myQuestion = [];

        for (let i = 0; i < otherCustomQuestionCard.length; i++) {
            let answerData = await AnswerCard.find({ questionId: otherCustomQuestionCard[i]['_id'], isOpen: true });
            if (!answerData) {
                answerData = 0;
            }
            myQuestion.push({
                // createdUserId: user.userId,
                // createdUserNickname: user.nickname,
                // createdUserProfileImg: user.profileImg,
                questionId: otherCustomQuestionCard[i]['_id'],
                questionContents: otherCustomQuestionCard[i]['contents'],
                questionTopic: otherCustomQuestionCard[i]['topic'],
                questionCreatedAt: otherCustomQuestionCard[i]['createdAt'],
                answerCount: answerData.length
            });
            //질문에 몇명답했는지
        }
        return res.send({ myQuestion });
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
});

// 공개 비공개 전환
router.patch('/private', authMiddleware, async (req, res, next) => {
    try {
        console.log('하이')
        user = res.locals.user;
        const { answerCardId, isOpen } = req.body
        const answerInfo = await AnswerCard.findOne({ _id: answerCardId })
        if (answerInfo.userId != user.userId) { return res.status(400).send('본인의 글만 공개,비공개 전환이 가능합니다.') }
        await AnswerCard.updateOne({ _id: answerCardId }, { $set: { isOpen } })
        return res.send('공개, 비공개 전환 성공')
    } catch (err) {
        return res.status(400).json({ msg: 'fail' });
    }
})

module.exports = router;