const { QuestionCard, AnswerCard, QuestionDaily, User } = require('../models');

module.exports = async () => {
	let cards = []
	availableCards = await QuestionCard.aggregate([{ $sample: { size: 3 } }]);
	for (card of availableCards) {
		let answer = await AnswerCard.find({ questionId: card._id });
		let createdUser = await User.findOne({ _id:card.createdUser });
		cards.push(
			{
			cardId : card._id,
			topic : card.topic,
			contents : card.contents,
			createdUser : createdUser.nickname,
			answerCount : answer.length
			}
		)
	}
	return cards;
}

/* // 대답 많은 순으로 질문 받기
    const { QuestionCard, AnswerCard, QuestionDaily, User } = require('../models');

module.exports = async () => {
   let cards = []
   const mostAnswer = await AnswerCard.aggregate([
      {"$group" : {_id:"$questionId", count:{$sum:1}}}
   ]).sort({ count: -1 }).limit(10)
   for (card of mostAnswer) {

      let question = await QuestionCard.findOne({ _id: card._id });

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
      if (cards.length == mostAnswer.length) {
         break;
      }
   }

   availableCards = await QuestionCard.find();
   while (cards.length < 3) {
      let index = Math.floor(Math.random() * availableCards.length);
      let answer = await AnswerCard.find({ questionId: availableCards[index]._id });
      let createdUser = await User.findOne({ _id: availableCards[index].createdUser });
      let temp = {
         cardId : availableCards[index]._id,
         topic : availableCards[index].topic,
         contents : availableCards[index].contents,
         createdUser : createdUser.nickname,
         answerCount : answer.length
      }

      if (cards.length == 0) {
         cards.push(temp)
      } else {
         let status = 0
         for (card of cards) {
            if (card.cardId == temp._id)
               status = 1
         }
         if (status == 0) {
            cards.push(temp)
         }
      }
      if (cards.length == availableCards.length) {
         break;
      }
   }
   return cards;
}
*/