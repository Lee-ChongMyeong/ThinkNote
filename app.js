const express = require('express');
const app = express();

const mongoose = require('./models/mongoose');
require('dotenv').config();

const cors = require('cors');
app.use(cors());

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// session
const session = require('express-session');
const MongoStore = require('connect-mongo');
app.use(
	session({
		secret: process.env.LOVE_SECRET_KEY,
		resave: false,
		saveUninitialized: true,
		store: MongoStore.create({
			mongoUrl: `mongodb://${process.env.LOVE_MONGO_URL}:27017/thinkNote`,
			ttl: 1000 * 60 * 60 * 24 * 30
		}),
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 30
		}
	})
);

const passport = require('./auth/passport');
app.use(passport.initialize());
app.use(passport.session());

app.use('/', require('./routers'));

//listen
app.listen(process.env.LOVE_PORT, () => {
	console.log(`Listening at http://localhost:${process.env.LOVE_PORT}`);
});
