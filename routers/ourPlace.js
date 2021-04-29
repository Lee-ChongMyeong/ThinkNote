const { QuestionCard, AnswerCard, QuestionDaily, Friend, User } = require('../models');
const express = require('express');
const router = express.Router();

router.get('/cards', async (req, res) => {
	try {

		result = [];
		const randomAnswers = await AnswerCard.aggregate([{ $group: { _id: '$questionId', count: { $sum: 1 } } }, { $sample: { size: 2 } }]);
        console.log(randomAnswers)
		for (randomAnswer of randomAnswers) {

			temp = {};
			let question = await QuestionCard.findOne({ _id: randomAnswer._id });
			let user = await User.findOne({ _id: question.createdUser });
            console.log(user)
			temp['questions'] = {
				questionId: question._id,
				contents: question.contents,
				topic: question.topic,
				nicname: user.nickname
			};
			let answers = await AnswerCard.find({ questionId: question._id, isOpen: true }).limit(4);
			temp['answers'] = [];

			for (answer of answers) {
				let answerUser = await User.findOne({ _id: answer.createdUser });
				temp['answers'].push({
					userId: answerUser._id,
					profileImg: answerUser.profileImg,
					nickname: answerUser.nickname,
					answerId: answer._id,
					contents: answer.contents
				});
			}
			result.push(temp);
		}
		res.json({ result: result });
	} catch (err) {
		console.log(err)
		res.status(400).json({ msg: 'fail' });
	}
});

module.exports = router;

// 질문 ( 내용, 토픽)
// 답글 (유저ID, 사진, 닉네임, 답글 내용)
