const User = require("../../models/users");
const { imageCheck, upload } = require("../../utils/file");
const { isValidEmail, usernameGenerating, userLoginSessionCreate } = require("../../utils/func");
const bcrypt = require("bcrypt");
const { createToken } = require("../../utils/jwt");
const SessionModel = require("../../models/userSession");
const salt = 11;

// Register User.......

exports.registerUser = async (req, res, next) => {
	let { name, username, email, phone, password } = req.body;
	let avatar = req.files.avatar;
	let issue = {};
	let nameOK, emailOK, passwordOK, phoneOK, usernameOK;
	// Name check
	if (name) {
		const letters = /^[A-Za-z\s]+$/; // Name char validation
		name = String(name).replace(/  +/g, " ").trim();
		const validFirstName = name.match(letters);
		if (validFirstName) {
			name = name;
			nameOK = true;
		} else {
			issue.error = "Name is not valid!";
		}
	} else {
		issue.error = "Please enter your name!";
	}
	if (email) {
		email = String(email).replace(/\s+/g, "").trim().toLowerCase();
		const emailLengthOk = email.length < 40;
		if (emailLengthOk) {
			if (isValidEmail(email)) {
				const emailExist = await User.exists({ email });
				if (!emailExist) {
					/* username generating */
					username = await usernameGenerating(email);
					emailOK = true;
				} else {
					issue.error = "An account has already associated with the email!";
				}
			} else {
				issue.error = "Please enter valid email address!";
			}
		} else {
			issue.error = "Email length is too long!";
		}
	} else {
		issue.error = "Please enter your email address!";
	}

	// check phone
	if (phone) {
		if (phone !== "NaN") {
			phone = phone;
			phoneOK = true;
		} else {
			issue.error = "Phone must be number.";
		}
	}
	// check password
	if (password) {
		const hashPassword = await bcrypt.hashSync(password, salt);
		password = hashPassword;
		passwordOK = true;
	} else {
		issue.error = "Please enter your password";
	}

	//check avatar
	if (req.files && req.files.avatar) {
		const theAvatar = req.files.avatar;
		const checkImage = imageCheck(theAvatar);
		if (checkImage.status) {
			var uploadResult = await upload(theAvatar.path);
			if (uploadResult.secure_url) {
				avatar = uploadResult.secure_url;
			} else {
				issue.error = uploadResult.message;
			}
		} else {
			issue.error = checkImage.message;
		}
	}

	try {
		if (nameOK && emailOK && passwordOK && usernameOK && phoneOK) {
			const newUser = new User({
				name,
				email,
				password,
				username,
				avatar,
				phone,
			});
			const saveUser = await newUser.save();
			if (saveUser) {
				return res.status(201).json({
					message: "User registered successfully",
					data: saveUser,
				});
			} else {
				issue.error = "Failed to register user";
			}
		}

		return res.status(400).json({ issue });
	} catch (error) {
		next(error);
	}
};

exports.loginUser = async (req, res, next) => {
	let { email, password } = req.body;
	let issue = {};

	let emailOK, passwordOK;

	// Email check...

	if (email) {
		const validEmail = await isValidEmail(email);
		if (validEmail) {
			email = email;
			emailOK = true;
		} else {
			issue.error = "Invalid email";
		}
	} else {
		issue.error = "Please enter your email";
	}

	// password check

	if (password) {
		password = password;
		passwordOK = true;
	} else {
		issue.error = "Please enter your pasword";
	}

	try {
		if (emailOK && passwordOK) {
			const findUser = await User.findOne({ email: email });
			if (findUser) {
				const matchPassword = await bcrypt.compareSync(password, findUser.password);
				if (matchPassword) {
					const generateToken = await createToken(findUser);
					const createSession = await userLoginSessionCreate(findUser.email, generateToken, 30);
					if (createSession) {
						const findUserInfo = await User.findOne({ email: email }).select({ password: 0 });
						return res.status(200).json({
							message: "Successfully logged In",
							accessToken: generateToken,
							data: findUserInfo,
						});
					}
				} else {
					issue.error = "Wrong password";
				}
			} else {
				issue.error = "There is no account associated with this email";
			}
		}
		return res.status(400).json({ issue });
	} catch (error) {
		next(error);
	}
};

// User Logout

exports.logoutUser = async (req, res, next) => {
	const user = req.user;
	const token = req.token;
	const findUsersSession = await SessionModel.findOne({ $and: [{ user: user.email }, { uuid: token }] });
	let issue = {};
	try {
		if (findUsersSession) {
			const deleteSession = await SessionModel.deleteOne({ $and: [{ user: user.email }, { uuid: token }] });
			if (deleteSession) {
				return res.status(200).json({
					message: "Successfully logged out...",
				});
			} else {
				issue.error = "Couldn't log out...Please try again.";
			}
		} else {
			issue.error = "You are already logged out..Please login";
		}

		res.status(400).json({ issue });
	} catch (error) {
		next(error);
	}
};

// Update user profile

exports.updateUserProfile = async (req, res, next) => {
	const user = req.user;
	let { name, email, password, phone } = req.body;
	let avatar = req.files.avatar;

	let issue = {};

	// Name check
	if (name) {
		const letters = /^[A-Za-z\s]+$/; // Name char validation
		name = String(name).replace(/  +/g, " ").trim();
		const validFirstName = name.match(letters);
		if (validFirstName) {
			name = name;
		} else {
			issue.error = "Name is not valid!";
		}
	} else {
		issue.error = "Please enter your name!";
	}
	if (email) {
		email = String(email).replace(/\s+/g, "").trim().toLowerCase();
		const emailLengthOk = email.length < 40;
		if (emailLengthOk) {
			if (isValidEmail(email)) {
				const emailExist = await User.findOne({ email });
				if (!emailExist) {
					email = email;
				} else {
					issue.error = "An account has already associated with the email!";
				}
			} else {
				issue.error = "Please enter valid email address!";
			}
		} else {
			issue.error = "Email length is too long!";
		}
	} else {
		issue.error = "Please enter your email address!";
	}

	// check phone
	if (phone) {
		if (phone !== "NaN") {
			phone = phone;
		} else {
			issue.error = "Phone must be number.";
		}
	}
	// check password
	if (password) {
		const hashPassword = await bcrypt.hashSync(password, salt);
		password = hashPassword;
	} else {
		issue.error = "Please enter your password";
	}

	//check avatar
	if (req.files && req.files.avatar) {
		const theAvatar = req.files.avatar;
		const checkImage = imageCheck(theAvatar);
		if (checkImage.status) {
			var uploadResult = await upload(theAvatar.path);
			if (uploadResult.secure_url) {
				avatar = uploadResult.secure_url;
			} else {
				issue.error = uploadResult.message;
			}
		} else {
			issue.error = checkImage.message;
		}
	}
	try {
		const updateUser = await User.findOneAndUpdate({ _id: user._id }, { $set: { name, email, phone, password, avatar } }, { new: true });
		if (updateUser) {
			res.status(200).json({
				message: "Profile updated successfully",
				data: updateUser,
			});
		} else {
			issue.error = "Profile not updated";
		}
		if (!res.headersSent) {
			res.status(400).json(issue);
		}
	} catch (error) {
		next(error);
	}
};
