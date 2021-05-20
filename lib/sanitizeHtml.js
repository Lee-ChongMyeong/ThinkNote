const sanitize = require('sanitize-html');

module.exports = (str) => {
	return sanitize(str)
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;/g, "'")
		.replace(/&quot;/g, '"');
};
