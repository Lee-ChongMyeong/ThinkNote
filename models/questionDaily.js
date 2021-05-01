const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionDaily = new Schema({
	userId: { type: String, required: true },
	questionId: { type: mongoose.Types.ObjectId },
	YYMMDD: { type: String, required: true },
	available: { type: Boolean, default: true }
});

questionDaily.virtual('questionDailyId').get(function () {
	return this._id.toHexString();
});

questionDaily.set('toObject', {
	virtuals: true
});
questionDaily.set('toJSON', {
	virtuals: true
});

module.exports = mongoose.model('QuestionDaily', questionDaily);
