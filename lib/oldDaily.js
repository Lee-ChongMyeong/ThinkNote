const mongoose = require('../models/mongoose');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');
const { QuestionDaily } = require('../models');

let standardTime = moment(Date.now() - 1000 * 60 * 60 * 24 * 2).format('YYMMDD');
QuestionDaily.deleteMany()
	.where('YYMMDD')
	.lt(standardTime)
	.exec()
	.then((log) => {
		console.log(log);
		mongoose.disconnect();
	});
