const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentBoard = new Schema(
	{
		commentContents: { type: String, required: true },
		cardId: { type: String, required: true },
		userId: { type: String, required: true },
		tag: { type: Array }
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
