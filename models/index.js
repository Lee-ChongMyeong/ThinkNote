const User = require('./user');
const QuestionCard = require('./questionCard');
const AnswerCard = require('./answerCard');
const Friend = require('./friend');
const Like = require('./like');
const QuestionDaily = require('./questionDaily');
const CommentBoard = require('./commentBoard');
const Alarm = require('./alarm');
const Search = require('./search');

const DB = {
	User,
	QuestionCard,
	AnswerCard,
	Friend,
	Like,
	QuestionDaily,
	CommentBoard,
	Alarm,
	Search
};

module.exports = DB;
