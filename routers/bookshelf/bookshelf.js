const express = require('express');
const router = express.Router();
const {
	AnswerCard,
	User,
	QuestionCard,
	Friend,
	Like,
	CommentBoard,
	Search
} = require('../../models');
const authMiddleware = require('../../auth/authMiddleware');
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

// 질문 카드 디테일 확인
// 날짜 작성 보여주기 // 답변 crud
router.get('/bookCardDetail/:answerId', async (req, res) => {
	try {
		const { answerId } = req.params;
		let user;
		const { authorization } = req.headers;
		console.log(authorization);
		if (authorization !== 'Bearer undefined') {
			const [tokenType, tokenValue] = authorization.split(' ');
			if (tokenType !== 'Bearer') return res.json({ msg: 'fail' });
			const { userId } = jwt.verify(tokenValue, process.env.LOVE_JWT_SECRET);
			user = await User.findOne({ _id: userId });
		}

		const bookCardDetail = [];
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
		return res.send({ bookCardDetail });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

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

// 토픽, 질문지
// 타임스탬프 아시아기준으로
// 내가 작성한 답변 모음 (최신순)
router.get('/answers', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const allMyAnswer = await AnswerCard.find({ userId: user.userId })
			.sort('-createdAt')
			.skip(page * 15)
			.limit(15);

		return res.send({ allMyAnswer });
	} catch (err) {
		return res.status(400).json({ msg: 'fail' });
	}
});

// 내가 작성한 답변 모음 (좋아요순)
router.get('/answers/like', authMiddleware, async (req, res) => {
	try {
		const user = res.locals.user;
		let { page } = req.query;
		page = (page - 1 || 0) < 0 ? 0 : page - 1 || 0;

		const allAnswer = await AnswerCard.aggregate([
			{ $match: { userId: { $eq: user.userId } } },
			{
				$project: {
					_id: { $toString: '$_id' },
					questionId: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					createdAt: 1
				}
			},
			{
				$lookup: { from: 'likes', localField: '_id', foreignField: 'answerId', as: 'likes' }
			},
			{ $sort: { likes: -1 } },
			{ $skip: page * 15 },
			{ $limit: 15 },
			{
				$project: {
					_id: 1,
					contents: 1,
					YYMMDD: 1,
					userId: 1,
					likes: { $size: '$likes' },
					createdAt: 1
				}
			}
		]);

		return res.json(allAnswer);
	} catch (err) {
		console.log(err);
		return res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;
