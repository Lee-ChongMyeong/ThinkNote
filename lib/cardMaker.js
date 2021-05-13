const txt = require('./source');
const mongoose = require('../models/mongoose');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault('Asia/Seoul');

const run = () => {
	const { QuestionCard } = require('../models');
	txt.toString()
		.split('\n')
		.forEach(async (element) => {
			let [topic, contents] = element.split('#');

			topic = topic.split(', ');
			if (topic && contents) {
				console.log(topic, element);
				await QuestionCard.create({
					topic,
					contents,
					createdUser: '609d27882fe142016da7a7a9',
					createdAt: moment().format('YYYY-MM-DD')
				});
			}
		});
};
run(() => mongoose.disconnect());
