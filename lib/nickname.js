const axios = require('axios');

const random = async () => {
	try {
		const response = await axios.get('https://nickname.hwanmoo.kr/?format=text&max_length=9');
		const nickname = response.data;
		return nickname;
	} catch (e) {
		console.log(e);
		return '';
	}
};

module.exports = random;
