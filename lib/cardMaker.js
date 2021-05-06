const txt = require('./source');
const mongoose = require('../models/mongoose');
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
					createdUser: '608971a172444320da6e8671'
				});
			}
		});
};
run(() => mongoose.disconnect());
