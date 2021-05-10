const { User, Alarm } = require('../models');
const jwt = require('jsonwebtoken');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

module.exports = function (socket, alarm) {
	console.log('New connection');
	socket.on('joinAlarm', async function (data) {
		const { token } = data;
		if (!token) {
			socket.disconnect();
			return;
		}
		// console.log(referer)
		console.log('로그인 성공');
		const { userId } = jwt.verify(token, process.env.LOVE_JWT_SECRET);
		socket.join(userId); // room - 내_id
		let alarms = await Alarm.find({ userId: userId }).sort('-date').limit(20);
		const msg = [];
		let checked = false;
		for (let alarmData of alarms) {
			console.log('alarmData', alarmData);
			if (alarmData.checked == true) checked = true;

			const recentUser = await User.findOne({
				_id: alarmData.userList[alarmData.userList.length - 1]
			});
			const user = await User.findOne({ _id: userId });
			console.log('user', user);

			let temp = {
				alarmId: alarmData._id,
				userId: alarmData.userId,
				recentNickname: recentUser.nickname,
				recentProfileImg: recentUser.profileImg,
				userNickname: user.nickname,
				countOthers: alarmData.userList.length - 1,
				cardId: alarmData.cardId,
				eventType: alarmData.eventType,
				time: moment(alarmData.date).format('YY-MM-DD HH:mm:ss')
			};
			msg.push(temp);
		}
		alarm.to(userId).emit('joinAlarm', { msg, checked });
	});

	socket.on('openAlarm', async function (data) {
		await Alarm.updateMany({ userId: data.id }, { $set: { checked: false } });
	});

	socket.on('leave', () => {
		console.log('leave');
		socket.leave();
	});
};
