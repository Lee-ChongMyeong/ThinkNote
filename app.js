const express = require('express');
const { Server } = require('http');
const socketIo = require('socket.io');
// const jwt = require('jsonwebtoken');
require('./models/mongoose');
require('dotenv').config();

const app = express();
const cors = require('cors');
app.use(cors({ origin: '*', credentials: true }));

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const passport = require('./auth/passport');
app.use(passport.initialize());

// const { User, Alarm } = require('./models');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

const http = Server(app);
const io = socketIo(http, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
		credentials: true
	}
});

const alarm = io.of('/alarm');
app.use((req, res, next) => {
	req.alarm = alarm;
	return next();
});
// app.set('alarm', alarm)

alarm.on(
	'connection',
	require('./lib/connectSocket')
	// function (socket){
	// 	console.log('New connection');
	// 	socket.on('joinAlarm', async function (data) {
	// 		const { token } = data;
	// 		if (!token) {
	// 			socket.disconnect();
	// 			return;
	// 		}
	// 		// console.log(referer)
	// 		console.log('로그인 성공');
	// 		const { userId } = jwt.verify(token, process.env.LOVE_JWT_SECRET);
	// 		socket.join(userId); // room - 내_id
	// 		let alarms = await Alarm.find({ userId: userId }).sort('-date').limit(20);
	// 		const msg = [];
	// 		let checked = false;
	// 		for (let alarmData of alarms) {
	// 			console.log('alarmData', alarmData);
	// 			if (alarmData.checked == true) checked = true;

	// 			const recentUser = await User.findOne({
	// 				_id: alarmData.userList[alarmData.userList.length - 1]
	// 			});
	// 			const user = await User.findOne({ _id: userId });
	// 			console.log('user', user);

	// 			let temp = {
	// 				alarmId: alarmData._id,
	// 				userId: alarmData.userId,
	// 				recentNickname: recentUser.nickname,
	// 				recentProfileImg: recentUser.profileImg,
	// 				userNickname: user.nickname,
	// 				countOthers: alarmData.userList.length - 1,
	// 				cardId: alarmData.cardId,
	// 				eventType: alarmData.eventType,
	// 				time: moment(alarmData.date).format('YY-MM-DD HH:mm:ss')
	// 			};
	// 			msg.push(temp);
	// 		}
	// 		alarm.to(userId).emit('joinAlarm', { msg, checked });
	// 	});

	// 	socket.on('openAlarm', async function (data) {
	// 		await Alarm.updateMany({ userId: data.id }, { $set: { checked: false } });
	// 	});

	// 	socket.on('leave', () => {
	// 		console.log('leave');
	// 		socket.leave();
	// 	});
	// }
);

app.use('/', require('./routers'));
//listen
http.listen(process.env.LOVE_PORT, () => {
	console.log(`Listening at http://localhost:${process.env.LOVE_PORT}`);
});
