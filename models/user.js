const mongoose = require('mongoose');
const { Schema } = mongoose;

const user = new Schema(
	{
		nickname: { type: String, required: true },
		socialId: { type: String, required: true },
		profileImg: {
			type: String,
			required: true,
			default:
				'https://blog.kakaocdn.net/dn/cyOIpg/btqx7JTDRTq/1fs7MnKMK7nSbrM9QTIbE1/img.jpg'
		},
		introduce: { type: String, default: '' },
		preferredTopic: {
			type: Object,
			default: {
				love: false,
				relationship: false,
				friendship: false,
				worth: false,
				dream: false,
				myself: false
			}
		},
		provider: { type: String },
		first: { type: Boolean, default: true }
	},
	{ timestamps: true }
);

user.virtual('userId').get(function () {
	return this._id.toHexString();
});

user.set('toObject', {
	virtuals: true
});
user.set('toJSON', {
	virtuals: true
});

user.index({ nickname: 'text' });

module.exports = mongoose.model('User', user);
