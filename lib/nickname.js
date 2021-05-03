const axios = require('axios');

module.exports = async () => {
	try {
		const response = await axios.get('https://nickname.hwanmoo.kr/?format=text&max_length=9');
		// const nickname = response.replace(' ', '_')
		return response;
	} catch (e) {
		console.log(e);
		return '';
	}
};
