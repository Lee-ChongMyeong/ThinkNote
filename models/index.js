const User = require('./user');
const QuestionCard = require('./questionCard');
const AnswerCard = require('./answerCard');
const Friend = require('./friend');
const Like = require('./like');
const QuestionDaily = require('./questionDaily');

const DB = {
	User,
	QuestionCard,
	AnswerCard,
	Friend,
	Like,
	QuestionDaily
};

module.exports = DB;
