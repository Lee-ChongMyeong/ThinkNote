const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionDaily = new Schema({
	userId: { type: String, required: true },
	question_one: { type: String },
	question_two: { type: String },
	question_thr: { type: String },
	date: { type: String, required: true, default: Date.now() },
},
	{ timestamps: true });

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
