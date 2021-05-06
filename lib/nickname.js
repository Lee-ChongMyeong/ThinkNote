const axios = require('axios');

module.exports = async () => {
	try {
		const response = await axios.get('https://nickname.hwanmoo.kr/?format=text&max_length=9');
		console.log(response.data);
		const nickname = response.data.replace(/ /gi, '_');
		return nickname;
	} catch (e) {
		console.log(e);
		return '';
	}
};
