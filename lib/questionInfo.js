const { QuestionCard, User } = require('../models');
const mongoose = require('mongoose');

module.exports = async (questionId) => {
	try {
			let result = await QuestionCard.aggregate()
				.match({ _id: mongoose.Types.ObjectId(questionId) })
				.project({ questionId: '$_id', topic: 1, contents: 1, createdUser: { $toObjectId: '$createdUser' } })
				.lookup({
					from: 'users',
					localField: 'createdUser',
					foreignField: '_id',
					as: 'userInfo'
				})
				.project({
					questionId: 1,
					topic: 1,
					contents: 1,
					createdUser: 1,
					nickname: { $arrayElemAt: ['$userInfo.nickname', 0] },
					profileImg: { $arrayElemAt: ['$userInfo.profileImg', 0] }
				})
				.project({ userInfo: 0 });

			console.log(result[0]);

			return result[0];
	} catch {
		return {}
	}
};
