const express = require('express');
const { Server } = require('http');
const socketIo = require('socket.io');
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
app.use(passport.initia1lize());

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

alarm.on('connection', function (socket) {
	require('./lib/connectSocket')(socket, alarm);
});

app.use('/', require('./routers'));
//listen
http.listen(process.env.LOVE_PORT, () => {
	console.log(`Listening at http://localhost:${process.env.LOVE_PORT}`);
});
