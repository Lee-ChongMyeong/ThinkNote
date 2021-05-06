const mongoose = require('mongoose');
const { Schema } = mongoose;

const friend = new Schema(
	{
		followingId: { type: String, required: true },
		followerId: { type: String, required: true }
	},
	{ timestamps: true }
);

friend.virtual('friendId').get(function () {
	return this._id.toHexString();
});

friend.set('toObject', {
	virtuals: true
});
friend.set('toJSON', {
	virtuals: true
});

module.exports = mongoose.model('Friend', friend);
