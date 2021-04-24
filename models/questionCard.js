const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionCard = new Schema({
	topic: { type: String },
	contents: { type: String, required: true },
	createdUser: { type: String }
});

questionCard.virtual('questionId').get(function () {
	return this._id.toHexString();
});

questionCard.set('toObject', {
	virtuals: true
});
questionCard.set('toJSON', {
	virtuals: true
});

module.exports = mongoose.model('QuestionCard', questionCard);
