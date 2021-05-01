const { Alarm, User } = require('../models');
module.exports = async (userId, cardId, eventType, recentUserId, alarm) => {
	try {
		let AlarmInfo = await Alarm.findOne({ userId: userId, cardId : cardId, eventType: eventType });
		console.log(AlarmInfo);

		if (!AlarmInfo) {
			AlarmInfo = await Alarm.create({
				userId: userId,
				userList: [recentUserId],
				cardId: cardId,
				eventType: eventType,
				date: Date.now()
			});
		} else {
			AlarmInfo['userList'].push(recentUserId);
			AlarmInfo['date'] = Date.now();
			await AlarmInfo.save();
		}
		const { recentUserNickname } = await User.findOne({ _id: recentUserId });

		alarm.to(userId).emit('AlarmEvent', {
			alarmId: AlarmInfo._id,
			userId: AlarmInfo.userId,
			recentNickname: recentUserNickname,
			cardId: cardId,
			eventType: eventType,
			checked: true,
			time: Date.now()
		});
	} catch {
		console.log('알림 모듈 에러')
	}
};
