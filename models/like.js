const mongoose = require('mongoose');
const { Schema } = mongoose;

const like = new Schema({
	userId: { type: String, required: true },
	answerId: { type: String, required: true }
});

like.virtual('likeId').get(function () {
	return this._id.toHexString();
});

like.set('toObject', {
	virtuals: true
});
like.set('toJSON', {
	virtuals: true
});

module.exports = mongoose.model('Like', like);
