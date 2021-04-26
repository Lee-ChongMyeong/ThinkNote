const express = require('express');
const app = express();

const mongoose = require('./models/mongoose');
require('dotenv').config();

const cors = require('cors');
app.use(cors({ origin: "*", credentials: true }))

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

const passport = require('./auth/passport');
app.use(passport.initialize());
app.use(passport.session());
app.use('/', require('./routers'));

//listen
app.listen(process.env.LOVE_PORT, () => {
	console.log(`Listening at http://localhost:${process.env.LOVE_PORT}`);
});
