const axios = require('axios');

const random = async () => {
	try {
		const response = await axios.get('https://nickname.hwanmoo.kr/?format=json&count=1');
		const nickname = response.data.words[0];
		return nickname;
	} catch (e) {
		console.log(e);
		return '';
	}
};

module.exports = random;
