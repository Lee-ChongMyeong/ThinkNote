const express = require('express');
const { Server } = require("http");
const socketIo = require("socket.io");
const jwt = require('jsonwebtoken');

const mongoose = require('./models/mongoose');
require('dotenv').config();

const app = express();
const cors = require('cors');
app.use(cors({ origin: "*", credentials: true }))

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const passport = require('./auth/passport');
app.use(passport.initialize());

const { User, Alarm } = require("./models")
const moment = require("moment")
const calTime = require('./lib/calTime')
require("moment-timezone")
moment.tz.setDefault("Asia/Seoul")

const http = Server(app);
const io = socketIo(http, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
})

const alarm = io.of("/alarm");
app.use((req, res, next) => {
	req.alarm = alarm
	return next();
})
// app.set('alarm', alarm)

alarm.on("connection", function (socket) {
	console.log('New connection')
	socket.on("joinAlarm", async function (data) {
		// const req = socket.request
		// const { headers: { referer } } = req
		const { token } = data
		if (!token) {
			socket.disconnect()
			return
		}
		// console.log(referer)
		console.log('로그인 성공')
		const { userId } = jwt.verify(token, process.env.LOVE_JWT_SECRET);
		socket.join(userId) // room - 내_id
		let alarms = await Alarm.find({ userId: userId }).sort({ updatedAt: -1 }).limit(40)
		msg = []
		let checked = false
		for (alarmData of alarms) {
			console.log('alarmData', alarmData)
			if (alarmData.checked == true)
				checked = true

			const recentUser = await User.findOne({ _id: alarmData.userList[alarmData.userList.length - 1] });
			const user = await User.findOne({ _id: userId });
			console.log('user', user)

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
			msg.push(temp)
		}
		alarm.to(userId).emit("joinAlarm", { msg, checked })
	})

	socket.on("openAlarm", async function (data) {
		console.log('======')
		console.log(data.id)
		const alarms = await Alarm.updateMany({ userId: id }, { $set: { checked: false } })
	})

	socket.on("leave", (data) => {
		console.log("leave")
		socket.leave()
	})

	// socket.on("disconnect", () => {
	// 	console.log("disconnect")
	// })
})

app.use('/', require('./routers'));
//listen
http.listen(process.env.LOVE_PORT, () => {
	console.log(`Listening at http://localhost:${process.env.LOVE_PORT}`);
});




