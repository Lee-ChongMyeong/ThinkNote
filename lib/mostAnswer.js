const { QuestionCard, AnswerCard, QuestionDaily, User } = require('../models');

module.exports = async () => {
	let cards = []
		const mostAnswer = await AnswerCard.aggregate([
			{"$group" : {_id:"$questionId", count:{$sum:1}}}
		]).sort({ count: -1 }).limit(10)
		for (card of mostAnswer) {
			console.log(card)
			let question = await QuestionCard.findOne({ _id: card._id });
			console.log(question)   // null

			if (!question) {
				continue;
			}
			let createdUser = await User.findOne({ _id: question.createdUser });
			let answer = await AnswerCard.find({ questionId: card._id });
			cards.push({
				cardId : question._id,
				topic : question.topic,
				contents : question.contents,
				createdUser : createdUser.nickname,
				answerCount : answer.length
			})
			if (cards.length >= 3) {
				return cards;
			}
		}
	return cards;
}
