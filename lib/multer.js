const multer = require('multer');
const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
require('dotenv').config();

const s3 = new AWS.S3({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: process.env.AWS_REGION
});

const storage = multerS3({
	s3: s3,
	bucket: process.env.AWS_S3_BUCKET_NAME,
	key: function (req, file, cb) {
		try {
			const fileType = file.mimetype.split('/')[0] != 'image';
			if (fileType) {
				console.log('이미지 타입 아님');
				return cb(new Error('Only images are allowed'));
			}
			let ex = file.originalname.split('.');
			cb(null, 'img' + Date.now() + parseInt(Math.random() * (99 - 10) + 10) + '.' + ex[ex.length - 1]);
		} catch {
			return cb(new Error('multer image upload error'));
		}
	},
	acl: 'public-read-write'
});

module.exports = multer({
	storage: storage
});
