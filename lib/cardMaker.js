const txt = require('./source');

const mongoose = require('../models/mongoose');
run = () => {
	const { QuestionCard } = require('../models');
	txt
		.toString()
		.split('\n')
		.forEach((element) => {
			[topic, contents] = element.split('#');
			if (topic && contents) {
				console.log(topic, contents);
				QuestionCard.create({ topic, contents, createdUser: 'admin' }).then(() => {
					mongoose.disconnect();
				});
			}
		});
};
run();
