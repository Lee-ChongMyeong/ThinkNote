/* eslint-disable no-undef */
const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentBoard = new Schema(
	{
		commentContents: { type: String, required: true },
		cardId: { type: String, required: true },
		userId: { type: String, required: true, index: true },
		tag: { type: Array },
		date: { type: Date, required: true }
	},
	{ timestamps: true }
);

commentBoard.virtual('commentId').get(function () {
	return this._id.toHexString();
});

commentBoard.set('toObject', {
	virtuals: true
});
commentBoard.set('toJSON', {
	virtuals: true
});

module.exports = mongoose.model('CommentBoard', commentBoard);
