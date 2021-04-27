const { QuestionCard, AnswerCard, QuestionDaily, User } = require('../models');

// module.exports = async () => {
// 	let cards = []
// 		const mostAnswer = await AnswerCard.aggregate([
// 			{"$group" : {_id:"$questionId", count:{$sum:1}}}
// 		]).sort({ count: -1 }).limit(10)
// 		for (let index in mostAnswer) {
// 			if (cards.length > 3) {
// 				break;
// 			}
// 			let question = await QuestionCard.findOne({ _id: mostAnswer[index]._id });
// 			let createdUser = await User.findOne({ _id: question.createdUser });
// 			cards.push({
// 				cardId : question._id,
// 				topic : question.topic,
// 				contents : question.contents,
// 				createdUser : createdUser.nickname
// 			})
// 		}
// 	return cards;
// }

module.exports = async () => {
	let cards = []
		const mostAnswer = await AnswerCard.aggregate([
			{"$group" : {_id:"$questionId", count:{$sum:1}}}
		]).sort({ count: -1 }).limit(10)
		for (let index in mostAnswer) {
			if (cards.length > 3) {
				break;
			}
			let question = await QuestionCard.findOne({ _id: mostAnswer[index]._id });
			let createdUser = await User.findOne({ _id: question.createdUser });
            console.log(question)
			cards.push({
				cardId : question._id,
				topic : question.topic,
				contents : question.contents,
				createdUser : createdUser.nickname
			})
		}
	return cards;
}
