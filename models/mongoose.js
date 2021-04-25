const mongoose = require('mongoose');
require('dotenv').config();
mongoose
	.connect(`mongodb://${process.env.LOVE_MONGO_URL}:27017/admin`, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		ignoreUndefined: true,
		user: "LKJ",
		pass: "sexycute"
	})
	.catch((err) => console.error(err));

mongoose.connection.on('error', (err) => {
	console.error('몽고디비 연결 에러', err);
});

module.exports = mongoose;
