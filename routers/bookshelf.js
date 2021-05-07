const express = require('express');
const {
	AnswerCard,
	User,
	QuestionCard,
	Friend,
	Like,
	Alarm,
	CommentBoard,
	Search
} = require('../models');
const authMiddleware = require('../auth/authMiddleware');
const router = express.Router();
const sanitize = require('sanitize-html');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 유저 검색
// 알파벳 대문자 소문자
router.post('/searchUser', async (req, res) => {
	try {
		const { words } = req.body;
		if (!words) {
			res.send({ userInfo: 'none' });
		}
		// ({ userId: { $ne: user.userId }, questionId: questionId })
		const userInfo = await User.find(
			{ provider: { $ne: '탈퇴' }, nickname: new RegExp(`${words}`) },
			{ createdAt: 0, updatedAt: 0, provider: 0, socialId: 0 }
		);
		if (userInfo) {
			res.send({ userInfo });
		} else {
			res.send({ userInfo: 'none' });
		}
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 유저검색 완료(검색 유저 클릭했을때)
router.post('/searchUserDetail', async (req, res) => {
	try {
		const { id } = req.body;
		const { authorization } = req.headers;
		if (!id) {
			res.send({ userInfo: 'none' });
		}
		if (!authorization) {
			return res.status(200).send({ msg: '로그인 안 하고 검색했습니다!' });
		}

		const [tokenType, tokenValue] = authorization.split(' ');
		if (tokenType !== 'Bearer') return res.json({ msg: 'fail' });
		const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);

		const myUserInfo = await User.findOne({ _id: userId }); // 내 ID
		let otherUserInfo = await User.findOne(
			{ _id: id },
			{ createdAt: 0, updatedAt: 0, provider: 0, socialId: 0 }
		); // 다른사람 ID

		const checkSearch = await Search.find({
			searchUserId: otherUserInfo._id,
			userId: myUserInfo.userId
		});
		const checkAllSearch = await Search.find({ userId: myUserInfo.userId });

		if (checkAllSearch.length >= 6) {
			await Search.deleteOne({ userId: myUserInfo.userId });
		}

		if (!checkSearch) {
			const result = await Search.create({
				searchUserId: otherUserInfo._id,
				userId: userId,
				YYMMDD: moment().format('YYMMDD')
			});
			return res.json({ result });
		} else {
			if (checkSearch.length >= 2) {
				await Search.deleteOne({
					searchUserId: otherUserInfo._id,
					userId: myUserInfo.userId
				});
			}
			await Search.deleteOne({ searchUserId: otherUserInfo._id, userId: myUserInfo.userId });
			const result = await Search.create({
				searchUserId: otherUserInfo._id,
				userId: userId,
				YYMMDD: moment().format('YYMMDD')
			});
			return res.json({ result });
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

// 최신 유저 검색 목록
router.get('/searchUser', async (req, res) => {
	const { authorization } = req.headers;
	let result = { msg: 'success', searchUser: [] };
	try {
		let standardTime = moment(Date.now() - 1000 * 60 * 60 * 24 * 30).format('YYMMDD');
		// 로그인 했을때
		if (authorization) {
			const [tokenType, tokenValue] = authorization.split(' ');
			if (tokenType !== 'Bearer') return res.json({ msg: 'fail' });
			const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			const user = await User.findOne({ _id: userId });
			if (!user) {
				throw 'undefined user!';
			}

			const users = await Search.find({ userId: userId })
				.where('YYMMDD')
				.gt(standardTime)
				.limit(5);
			for (let userData of users) {
				const userInfo = await User.findOne({ _id: userData.searchUserId });
				let temp = {
					profileImg: userInfo['profileImg'],
					nickname: userInfo.nickname,
					searchUserId: userData.searchUserId,
					userId: userData.userId
				};
				result['searchUser'].push(temp);
			}
			res.status(200).json({ result });
		}
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 다른 사람 책장 & 페이지 들어갈 때 정보 확인
// 친구인지 아닌지
router.get('/auth/user/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const userInfo = await User.findOne({ _id: id });
		const otherQuestion = await QuestionCard.find({ createdUser: id });
		const otherAnswer = await AnswerCard.find({ userId: id });
		res.json({
			nickname: userInfo.nickname,
			profileImg: userInfo.profileImg,
			introduce: userInfo.introduce,
			topic: userInfo.preferredTopic,
			otherCustomQuestionCount: otherQuestion.length,
			otherAnswerCount: otherAnswer.length
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 내 책장 월별 확인
router.get('/books/:YYMM', authMiddleware, async (req, res) => {
	try {
		const { YYMM } = req.params;
		const user = res.locals.user;
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
router.get('/other/books/:YYMM/:id', authMiddleware, async (req, res) => {
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
router.get('/bookDetail/:YYMMDD', authMiddleware, async (req, res) => {
	try {
		const { YYMMDD } = req.params;
		const user = res.locals.user;
		const booksDetail = await AnswerCard.find({ userId: user.userId, YYMMDD: YYMMDD });
		const booksDiary = [];

		for (let i = 0; i < booksDetail.length; i++) {
			const { contents, createdUser, _id, topic } = await QuestionCard.findOne({
				_id: booksDetail[i]['questionId']
			});
			console.log(topic);
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
				questionTopic: topic,
				answerId: booksDetail[i]['_id'],
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
router.get('/other/bookDetail/:YYMMDD/:id', authMiddleware, async (req, res) => {
	try {
		const { YYMMDD } = req.params;
		const { id } = req.params;
		const booksDetail = await AnswerCard.find({ userId: id, YYMMDD: YYMMDD });
		const booksDiary = [];
		for (let i = 0; i < booksDetail.length; i++) {
			const { contents, createdUser, _id, topic } = await QuestionCard.findOne({
				_id: booksDetail[i]['questionId']
			});
			const questionUserInfo = await User.findOne({ _id: createdUser });
			const likeCount = await Like.find({ answerId: booksDetail[i]['_id'] });
			const likeCountNum = likeCount.length;

			booksDiary.push({
				questionId: _id,
				questionCreatedUserId: questionUserInfo._id,
				questionCreatedUserNickname: questionUserInfo.nickname,
				questionCreatedUserProfileImg: questionUserInfo.profileImg,
				questionContents: contents,
				qeustionTopic: topic,
				answerId: booksDetail[i]['_id'],
				answerContents: booksDetail[i]['contents'],
				answerUserNickname: '', //수정 필요!!!!!!!!!!!!
				isOpen: booksDetail[i]['isOpen'],
				likeCount: likeCountNum
			});
		}
		return res.send({ booksDiary });
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 질문 카드 디테일 확인
// 날짜 작성 보여주기 // 답변 crud
router.get('/bookCardDetail/:answerId', async (req, res) => {
	try {
		const { answerId } = req.params;
		console.log(answerId);
		let user;
		const { authorization } = req.headers;
		if (authorization) {
			const [tokenType, tokenValue] = authorization.split(' ');
			if (tokenType !== 'Bearer') return res.json({ msg: 'fail' });
			const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			user = await User.findOne({ _id: userId });
		}

		const bookCardDetail = [];
		const other = [];
		let currentLike = false;
		// 만든 사람 찾기
		const booksDetail = await AnswerCard.findOne({ _id: answerId });
		const { contents, createdUser, topic, _id } = await QuestionCard.findOne({
			_id: booksDetail.questionId
		});
		const questionUserInfo = await User.findOne({ _id: createdUser });

		//답변단 사람 찾기
		const answerUserInfo = await User.findOne({ _id: booksDetail.userId });

		const likeCount = await Like.find({ answerId: booksDetail['_id'] });
		const likeCountNum = likeCount.length;
		// const currentLike = false;
		if (user) {
			const checkCurrentLike = await Like.findOne({
				userId: user.userId,
				answerId: answerId
			});
			if (checkCurrentLike) {
				currentLike = true;
			} else {
				currentLike = false;
			}
		} else {
			currentLike = false;
		}

		bookCardDetail.push({
			questionId: _id,
			questionCreatedUserId: questionUserInfo._id,
			questionCreatedUserNickname: questionUserInfo.nickname,
			profileImg: questionUserInfo.profileImg,
			questionTopic: topic,
			questionContents: sanitize(contents),
			answerId: booksDetail._id,
			answerContents: sanitize(booksDetail.contents),
			answerUserId: answerUserInfo._id,
			answerUserProfileImg: answerUserInfo.profileImg,
			nickname: sanitize(answerUserInfo.nickname),
			isOpen: booksDetail.isOpen,
			like: currentLike,
			likeCount: likeCountNum
		});
		return res.send({ bookCardDetail, other });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

// 다른 사람 질문 카드 디테일 확인 폐기처리
// router.get('/other/bookCardDetail/:questionId/:answerId/:id', authMiddleware, async (req, res, next) => {
//     try {
//         const { YYMMDD, questionId, answerId, id } = req.params;
//         bookCardDetail = [];
//         other = [];
//         const booksDetail = await AnswerCard.findOne({ _id: answerId });
//         const { contents, createdUser, topic } = await QuestionCard.findOne({ _id: questionId });
//         const questionUserInfo = await User.findOne({ _id: createdUser });

//         const likeCount = await Like.find({ answerId: booksDetail['_id'] });
//         const likeCountNum = likeCount.length;

//         const checkCurrentLike = await Like.findOne({ userId: id, answerId: answerId })
//         const currentLike = false

//         if (checkCurrentLike) { const currentLike = true }

//         bookCardDetail.push({
//             questionCreatedUserId: questionUserInfo._id,
//             questionCreatedUserNickname: questionUserInfo.nickname,
//             questionCreatedUserProfileImg: questionUserInfo.profileImg,
//             questionTopic: topic,
//             questionContents: sanitize(contents),
//             answerId: booksDetail._id,
//             answerContents: sanitize(booksDetail.contents),
//             answerUserNickname: user.nickname,
//             isOpen: booksDetail.isOpen,
//             currentLike: currentLike,
//             likeCount: likeCountNum
//         });
//         return res.send({ bookCardDetail, other });
//     } catch (err) {
//         return res.status(400).json({ msg: 'fail' });
//     }
// });

// 커스텀 질문 등록
// 질문글자 5개 이상 하기
router.post('/question', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		const { contents, topic } = req.body;
		if (!topic) {
			return res.status(400).send({ msg: '토픽을 넣어주세요' });
		}
		if (contents.length < 5) {
			return res.status(400).send({ msg: '그래도 질문인데 5글자는 넘겨주셔야져!' });
		}
		const Today = moment().format('YYYY-MM-DD');
		// 하루에 1번 질문할 수 있는것 체크
		const checkToday = await QuestionCard.findOne({
			createdUser: user.userId,
			createdAt: Today
		})
			.sort({ date: 1 })
			.limit(1);
		if (checkToday === null) {
			// 이미 있는 질문인지 검사
			const originContents = await QuestionCard.findOne({ contents: contents });
			if (!originContents) {
				const CustomQuestion = await QuestionCard.create({
					topic: sanitize(topic),
					contents: sanitize(contents),
					createdUser: user.userId,
					createdAt: moment().format('YYYY-MM-DD')
				});
				const { nickname } = await User.findOne({ _id: user.userId });
				return res.send({ CustomQuestion, profileImg: user.profileImg, nickname });
			} else {
				return res.send({ msg: '이미 존재하는 질문입니다' });
			}
		} else {
			if (Today === checkToday.createdAt) {
				return res
					.status(400)
					.send({ msg: '오늘은 이미 질문을 남겼어요. 힝 아쉽지만 다음에' });
			}
		}
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

// 친구 추가
router.post('/addfriend', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		const { friendId } = req.body;
		const checkFriend = await Friend.findOne({
			followingId: user.userId,
			followerId: friendId
		});
		if (checkFriend) {
			return res.send('이미 친구입니다.');
		}

		await Friend.create({
			followingId: user.userId,
			followerId: friendId
		});
		return res.status(200).json({ msg: '친구추가 성공' });
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 친구해제ㅠㅠ
router.delete('/friend', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		const { friendId } = req.body;
		const checkFriend = await Friend.findOne({
			followingId: user.userId,
			followerId: friendId
		});
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
router.get('/friendList', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		const friendList = await Friend.find({ followingId: user.userId });
		const friends = [];
		for (let i = 0; i < friendList.length; i++) {
			const friendInfo = await User.findOne({ _id: friendList[i]['followerId'] });
			friends.push({
				friendId: friendInfo._id,
				friendNickname: sanitize(friendInfo.nickname),
				friendProfileImg: friendInfo.profileImg
			});
		}
		return res.send({ friends });
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 타인의 친구 목록
router.get('/other/friendList/:id', async (req, res) => {
	try {
		const { id } = req.params;
		const friendList = await Friend.find({ followingId: id });
		const othersFriend = [];
		for (let i = 0; i < friendList.length; i++) {
			const friendInfo = await User.findOne({ _id: friendList[i]['followerId'] });
			othersFriend.push({
				otherFriendId: friendInfo._id,
				otherFriendNickname: sanitize(friendInfo.nickname),
				otherFriendProfileImg: friendInfo.profileImg
			});
		}
		return res.send({ othersFriend });
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 답변카드 좋아요 클릭
router.post('/like/answerCard', authMiddleware, async (req, res) => {
	try {
		const { answerCardId } = req.body;
		console.log(answerCardId);
		const user = res.locals.user;
		const currentLike = await Like.findOne({ userId: user.userId, answerId: answerCardId });
		const answer = await AnswerCard.findOne({ _id: answerCardId });
		if (currentLike) {
			return res.send('이미 좋아요 누른 상태');
		}
		// 새로고침하고 커뮤니티왔을 때 그때 좋아요가 되있는걸 취소했을 떄,
		//
		await Like.create({
			answerId: answerCardId,
			userId: user.userId
		});
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
router.patch('/like/answerCard', authMiddleware, async (req, res) => {
	try {
		const { answerCardId } = req.body;
		const user = res.locals.user;

		const currentLike = await Like.findOne({ userId: user.userId, answerId: answerCardId });
		if (!currentLike) {
			return res.send('좋아요가 안되어있는데 어떻게 좋아요를 취소합니까 아시겠어여?');
		}

		await Like.deleteOne({ answerId: answerCardId, userId: user.userId });
		let answer = await AnswerCard.findOne({ _id: answerCardId });

		const likeCount = await Like.find({ answerId: answerCardId });
		const likeCountNum = likeCount.length;

		let alarmInfo = await Alarm.findOne({
			userId: answer.userId,
			cardId: answerCardId,
			eventType: 'like'
		});
		if (alarmInfo['userList'].length == 1 && -1 != alarmInfo['userList'].indexOf(user._id)) {
			await Alarm.deleteOne({
				userId: answer.userId,
				cardId: answerCardId,
				eventType: 'like'
			});
		}
		// elif (!alarmInfo) { return }
		else {
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
router.get('/moreInfoCardTitle/:questionId', async (req, res) => {
	try {
		const { questionId } = req.params;
		const questionInfo = await QuestionCard.findOne({ _id: questionId });
		const userInfo = await User.findOne({ _id: questionInfo.userId });
		const answerData = await AnswerCard.find({ questionId: questionId, isOpen: true });
		console.log(questionInfo.topic);

		return res.send({
			questionId: questionInfo._id,
			questionContents: sanitize(questionInfo.contents),
			questionCreatedUserId: userInfo._id,
			questionCreatedUserNickname: userInfo.nickname,
			questionCreatedUserProfileImg: userInfo.profileImg,
			questionTopic: questionInfo.topic,
			answerCount: answerData.length
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 더보기 답변들
// 기본 내려주기
router.get('/moreInfoCard/:questionId', async (req, res) => {
	try {
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const { questionId } = req.params;

		const allAnswer = await AnswerCard.aggregate([
			{ $match: { questionId: { $eq: questionId } } },
			{
				$project: {
					_id: { $toString: '$_id' },
					questionId: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1
				}
			},
			{
				$lookup: { from: 'likes', localField: '_id', foreignField: 'answerId', as: 'likes' }
			},
			{ $sort: { YYMMDD: -1 } },
			{ $skip: page * 2 },
			{ $limit: 2 },
			{
				$project: {
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' }
				}
				// answerId: '$_id'
			}
		]);

		const answer = [];
		for (let i = 0; i < allAnswer.length; i++) {
			const UserInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
			answer.push({
				userId: UserInfo._id,
				userNickname: UserInfo.nickname,
				userProfileImg: UserInfo.profileImg,
				answerId: allAnswer[i]['_id'],
				answerContents: sanitize(allAnswer[i]['contents']),
				answerLikes: allAnswer[i]['likes']
			});
		}
		return res.send({ answer });
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 더보기 답변들
// 친구가 쓴 것만 (로그인 안했을 경우는 로그인 필요한 기능이라고 뜨게 말하기)
router.get('/moreInfoCard/friend/:questionId', authMiddleware, async (req, res) => {
	try {
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;
		const { questionId } = req.params;
		const user = res.locals.user;

		// 친구 감별
		const followerId = await Friend.find({ followingId: user.userId });
		const friendList = [];

		for (let i = 0; i < followerId.length; i++) {
			friendList.push(followerId[i]['followerId']);
		}

		const allAnswer = await AnswerCard.aggregate([
			{ $match: { userId: { $in: friendList }, questionId: { $eq: questionId } } },
			{
				$project: {
					_id: { $toString: '$_id' },
					questionId: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1
				}
			},
			{
				$lookup: { from: 'likes', localField: '_id', foreignField: 'answerId', as: 'likes' }
			},
			{ $sort: { likes: -1 } },
			{ $skip: page * 2 },
			{ $limit: 2 },
			{
				$project: {
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' }
				}
			}
		]);

		const answer = [];
		for (let i = 0; i < allAnswer.length; i++) {
			const userInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
			answer.push({
				userId: userInfo._id,
				userNickname: userInfo.nickname,
				userProfileImg: userInfo.profileImg,
				answerId: allAnswer[i]['_id'],
				answerContents: sanitize(allAnswer[i]['contents']),
				answerLikes: allAnswer[i]['likes']
			});
		}
		return res.json(answer);
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 더보기 답변
// 좋아요순위 나중에이용할것
router.get('/moreInfoCard/like/:questionId', async (req, res) => {
	try {
		const { questionId } = req.params;
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const allAnswer = await AnswerCard.aggregate([
			{ $match: { questionId: { $eq: questionId } } },
			{
				$project: {
					_id: { $toString: '$_id' },
					questionId: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1
				}
			},
			{
				$lookup: { from: 'likes', localField: '_id', foreignField: 'answerId', as: 'likes' }
			},
			{ $sort: { likes: -1 } },
			{ $skip: page * 2 },
			{ $limit: 2 },
			{
				$project: {
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' }
				}
				// answerId: '$_id'
			}
		]);

		let answer = [];
		for (let i = 0; i < allAnswer.length; i++) {
			const userInfo = await User.findOne({ _id: allAnswer[i]['userId'] });
			answer.push({
				userId: userInfo._id,
				userNickname: userInfo.nickname,
				userProfileImg: userInfo.profileImg,
				answerId: allAnswer[i]['_id'],
				answerContents: allAnswer[i]['contents'],
				answerLikes: allAnswer[i]['likes']
			});
		}
		// 유저 정보 넣어주기 이름이랑 값
		return res.json(answer);
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

//내 커스텀 카드 질문조회 (최신순)
router.get('/question', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const allMyQuestion = await QuestionCard.find({ createdUser: user.userId });
		const myCustomQuestionCard = await QuestionCard.find({ createdUser: user.userId })
			.sort('-createdAt')
			.skip(page * 15)
			.limit(15);
		const myQuestion = [];

		for (let i = 0; i < myCustomQuestionCard.length; i++) {
			let answerData = await AnswerCard.find({
				questionId: myCustomQuestionCard[i]['_id'],
				isOpen: true
			});
			if (!answerData) {
				answerData = 0;
			}
			myQuestion.push({
				questionId: myCustomQuestionCard[i]['_id'],
				questionContents: sanitize(myCustomQuestionCard[i]['contents']),
				questionTopic: myCustomQuestionCard[i]['topic'],
				questionCreatedAt: myCustomQuestionCard[i]['createdAt'],
				answerCount: answerData.length
			});
		}
		return res.send({
			myQuestionCount: allMyQuestion.length,
			myQuestion
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 내 커스텀 카드 질문조회(답변 많은 순)
router.get('/like/question', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const myCustomQuestionCard = await QuestionCard.aggregate([
			{ $match: { createdUser: { $eq: user.userId } } },
			{ $project: { _id: { $toString: '$_id' }, topic: 1, contents: 1, createdUser: 1 } },
			{
				$lookup: {
					from: 'answercards',
					localField: '_id',
					foreignField: 'questionId',
					as: 'answercards'
				}
			},
			{ $sort: { answercards: -1 } },
			{ $skip: page * 15 },
			{ $limit: 15 },
			{
				$project: {
					_id: 1,
					contents: 1,
					createdUser: 1,
					answerLength: { $size: '$answercards' }
				}
			}
		]);

		let result = [];
		for (let i = 0; i < myCustomQuestionCard.length; i++) {
			result.push({
				questionId: myCustomQuestionCard[i]['_id'],
				questionContents: sanitize(myCustomQuestionCard[i]['contents']),
				questionTopic: myCustomQuestionCard[i]['topic'],
				questionCreatedAt: myCustomQuestionCard[i]['createdAt'],
				answerCount: myCustomQuestionCard[i]['answerLength']
			});
		}
		return res.send({
			result: result
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

//다른 사람 커스텀 카드 질문조회 (최신순)
router.get('/other/:id/question', authMiddleware, async (req, res) => {
	try {
		let { page } = req.query;
		const { id } = req.params;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;
		const allOtherQuestion = await QuestionCard.find({ createdUser: id });
		const otherCustomQuestionCard = await QuestionCard.find({ createdUser: id })
			.sort('-createdAt')
			.skip(page * 15)
			.limit(15);
		const myQuestion = [];

		for (let i = 0; i < otherCustomQuestionCard.length; i++) {
			let answerData = await AnswerCard.find({
				questionId: otherCustomQuestionCard[i]['_id'],
				isOpen: true
			});

			myQuestion.push({
				questionId: otherCustomQuestionCard[i]['_id'],
				questionContents: sanitize(otherCustomQuestionCard[i]['contents']),
				questionTopic: otherCustomQuestionCard[i]['topic'],
				questionCreatedAt: otherCustomQuestionCard[i]['createdAt'],
				answerCount: answerData.length
			});
			//질문에 몇명답했는지
		}
		return res.send({
			otherQuestionCount: allOtherQuestion.length
			//otherQuestion // 확인필요 !!!!!!!!!!!!!!!!!!
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

//다른 사람 커스텀 카드 질문조회 (인기순)
router.get('/other/like/:id/question', authMiddleware, async (req, res) => {
	try {
		let { page } = req.query;
		const { id } = req.params;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const otherCustomQuestionCard = await QuestionCard.aggregate([
			{ $match: { createdUser: { $eq: id } } },
			{ $project: { _id: { $toString: '$_id' }, topic: 1, contents: 1, createdUser: 1 } },
			{
				$lookup: {
					from: 'answercards',
					localField: '_id',
					foreignField: 'questionId',
					as: 'answercards'
				}
			},
			{ $sort: { answercards: -1 } },
			{ $skip: page * 15 },
			{ $limit: 15 },
			{
				$project: {
					_id: 1,
					contents: 1,
					createdUser: 1,
					answerLength: { $size: '$answercards' }
				}
			}
		]);

		let result = [];
		for (let i = 0; i < otherCustomQuestionCard.length; i++) {
			result.push({
				questionId: otherCustomQuestionCard[i]['_id'],
				questionContents: sanitize(otherCustomQuestionCard[i]['contents']),
				questionTopic: otherCustomQuestionCard[i]['topic'],
				questionCreatedAt: otherCustomQuestionCard[i]['createdAt'],
				answerCount: otherCustomQuestionCard[i]['answerLength']
			});
			//질문에 몇명답했는지
		}
		return res.send({
			result: result
		});
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 공개 비공개 전환
router.patch('/private', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		const { answerCardId, isOpen } = req.body;
		const answerInfo = await AnswerCard.findOne({ _id: answerCardId });
		if (answerInfo.userId != user.userId) {
			return res.status(400).send('본인의 글만 공개,비공개 전환이 가능합니다.');
		}
		await AnswerCard.updateOne({ _id: answerCardId }, { $set: { isOpen } });
		return res.send('공개, 비공개 전환 성공');
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
