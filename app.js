const express = require('express');
const { Server } = require("http")
const socket = require("socket.io")

const mongoose = require('./models/mongoose');
require('dotenv').config();

const app = express()
const http = Server(app)
socket(http, app)

const cors = require('cors');
app.use(cors({ origin: "*", credentials: true }))

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const passport = require('./auth/passport');
app.use(passport.initialize());
app.use('/', require('./routers'));


const socketIo = require("socket.io")
const { User, Alarm } = require("./models")
const moment = require("moment")
const calTime = require('./lib/calTime')
require("moment-timezone")
moment.tz.setDefault("Asia/Seoul")

const io = socketIo(http, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
})

const alarm = io.of("/alarm")
module.exports = { alarm }
alarm.on("connection", function (socket) {
	console.log('New connection')
	socket.on("joinAlarm", async function (data) {
		const req = socket.request
		const { headers: { referer } } = req
		console.log(referer)

		const { token } = data
		const { userId } = jwt.verify(token, process.env.LOVE_JWT_SECRET);

		socket.join(userId) // room - 내_id
		const alarms = await Alarm.find({ userId: userId }).sort({ updatedAt: -1 })
		msg = []
		let checked = false
		for (alarm of alarms) {
			if (alarm.checked == true)
				checked = true
			const temp = {
				alarmId: alarm._id,
				userId: alarm.userId,
				recentNickname: alarm.userList[alarm.userList.length - 1],
				countOthers: alarm.userList.length - 1,
				cardId: alarm.cardId,
				eventType: alarm.eventType,
				time: calTime(Date(alarm.updatedAt))
			}
			msg.push(temp)
		}
		alarm.to(userId).emit("joinAlarm", { msg, checked })
	})

	socket.on("openAlarm", async function (data) {
		const alarms = await Alarm.updateMany({ _id: socket.room }, { $set: { checked: false } })
	})

	socket.on("leave", (data) => {
		console.log("leave")
		socket.leave(data.room)
	})

	socket.on("disconnect", () => {
		console.log("disconnect")
	})
})



//listen
http.listen(process.env.LOVE_PORT, () => {
	console.log(`Listening at http://localhost:${process.env.LOVE_PORT}`);
});




