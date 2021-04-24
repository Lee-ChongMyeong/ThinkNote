const mongoose = require('mongoose');
const { Schema } = mongoose;

const answerCard = new Schema({
	contents: { type: String, required: true },
	YYMMDD: { type: String },
	userId: { type: String }
});

answerCard.virtual('answerId').get(function () {
	return this._id.toHexString();
});

answerCard.set('toObject', {
	virtuals: true
});
answerCard.set('toJSON', {
	virtuals: true
});

module.exports = mongoose.model('AnswerCard', answerCard);
