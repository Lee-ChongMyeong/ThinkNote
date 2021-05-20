const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentLike = new Schema({
	commentId: { type: String, required: true },
	userId: { type: String, required: true }
});

commentLike.virtual('likeId').get(function () {
	return this._id.toHexString();
});

commentLike.set('toObject', {
	virtuals: true
});
commentLike.set('toJSON', {
	virtuals: true
});

module.exports = mongoose.model('CommentLike', commentLike);
