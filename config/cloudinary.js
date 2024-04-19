const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const configure = () => {
	try {
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_API_SECRET,
			secure: true,
		});

		console.log("Configured successful.");
	} catch (error) {
		console.log("Configured failed!");
		console.error(error);
		process.exit(1);
	}
};

module.exports = configure;