const { Alarm, User } = require('../models');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

module.exports = async (userId, cardId, eventType, recentUserId, alarm) => {
	try {
		console.log('알람시작');
		if (userId === recentUserId) return;
		let AlarmInfo = await Alarm.findOne({
			userId: userId,
			cardId: cardId,
			eventType: eventType
		});
		if (!AlarmInfo) {
			AlarmInfo = await Alarm.create({
				userId: userId,
				userList: [recentUserId],
				cardId: cardId,
				eventType: eventType,
				date: Date.now()
			});
			console.log('1');
		} else {
			if (-1 == AlarmInfo['userList'].indexOf(recentUserId))
				AlarmInfo['userList'].push(recentUserId);
			AlarmInfo['date'] = Date.now();
			AlarmInfo['checked'] = true;
			await AlarmInfo.save();
		}
		const recentUser = await User.findOne({ _id: recentUserId });
		const user = await User.findOne({ _id: userId });

		// console.log('Nickname:', user.nickname, recentUser.nickname);
		console.log('2');
		alarm.to(userId).emit('AlarmEvent', {
			alarmId: AlarmInfo._id,
			userId: userId,
			userNickname: user.nickname,
			recentNickname: recentUser.nickname,
			recentProfileImg: recentUser.profileImg,
			cardId: cardId,
			eventType: eventType,
			checked: true,
			time: moment(Date.now()).format('YY-MM-DD HH:mm:ss')
		});
	} catch (err) {
		console.log(err);
		console.log('알림 모듈 에러');
	}
};
