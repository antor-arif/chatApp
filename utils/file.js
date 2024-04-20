const fs = require("fs");
const cloudinary = require("cloudinary").v2;

/**
 * Check file is an image or not
 *
 * @param {File} file File object
 */
const imageCheck = (image) => {
	let message, status;

	if (image && image.type) {
		const isImage = image.type.startsWith("image/");
		if (isImage) {
			status = true;
		} else {
			message = "Only image files are allowed!";
		}
	} else {
		message = "Image field is empty!";
	}

	return { status, message };
};

const pdfCheck = (file) => {
	let message, status;
	if (file && file.type) {
		const isPDF = file.type === "application/pdf";
		if (isPDF) {
			status = true;
		} else {
			message = "Only PDF files are allowed!";
		}
	} else {
		message = "File field is empty!";
	}
	return { status, message };
};

async function multipleFilesCheckAndUpload(files) {
	const filesUrl = [];
	let errorMessage;
	if (files) {
		if (files.length === undefined) {
			files = [files];
		} else {
			files = files;
		}

		// check files
		let filesOk;
		for (const file of files) {
			if (file.size > 0) {
				if (!file.type) {
					break;
				}
			} else {
				break;
			}
			filesOk = true;
		}

		// files upload
		if (filesOk) {
			for (const file of files) {
				const uploadResult = await upload(file);
				if (uploadResult.secure_url) {
					filesUrl.push(uploadResult.secure_url);
				} else {
					errorMessage = uploadResult.message;
					break;
				}
			}
		} else {
			errorMessage = "There is an error with upload files!";
		}
	}

	return { filesUrl, errorMessage };
}

const upload = async (file) => {
	try {
		let rt;

		rt = await cloudinary.uploader.upload(file, { resource_type: "raw" });

		fs.unlinkSync(file);

		return rt;
	} catch (err) {
		return { error: err.message || "Failed to upload file" };
	}
};

module.exports = { imageCheck, multipleFilesCheckAndUpload, upload, pdfCheck };