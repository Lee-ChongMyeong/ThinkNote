const multer = require('multer');
const multerS3 = require('multer-s3-transform');
const sharp = require('sharp');
const s3 = require('./s3');

const storage = multerS3({
	s3: s3,
	bucket: process.env.AWS_S3_BUCKET_NAME,
	contentType: multerS3.AUTO_CONTENT_TYPE,
	shouldTransform: true,
	transforms: [
		{
			id: 'resized',
			key: function (req, file, cb) {
				try {
					const fileType = file.mimetype.split('/')[0] != 'image';
					if (fileType) {
						console.log('이미지 타입 아님');
						return cb(new Error('Only images are allowed'));
					}
					let ex = file.originalname.split('.');
					cb(
						null,
						'img' +
							Date.now() +
							parseInt(Math.random() * (99 - 10) + 10) +
							'.' +
							ex[ex.length - 1]
					);
				} catch {
					return cb(new Error('multer image upload error'));
				}
			},
			transform: (req, file, cb) => {
				cb(null, sharp().resize({ width: 400 }).rotate());
			}
		}
	],
	acl: 'public-read-write'
});

module.exports = multer({
	storage: storage
});
