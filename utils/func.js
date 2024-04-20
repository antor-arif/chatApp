const { v4: uuid } = require("uuid");
const UserSession = require("../models/userSession");

function isValidEmail(email) {
	const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	const allowChars = /^[0-9a-zA-Z_@.]+$/;
	const validEmail = re.test(email) && allowChars.test(email);
	return validEmail;
}



async function usernameGenerating(email, model, forbiddenUsernames) {
	const User = require("../models/users");
	model = model || User;
	forbiddenUsernames = forbiddenUsernames || ["account", "accounts", "user", "users", "admin", "admins", "api"];
	const targetOfSlice = email.indexOf("@");
	let username = email.slice(0, targetOfSlice);
	let usernameExist = await model.findOne({ username });
	let IsForbiddenUsernames = forbiddenUsernames.includes(username);

	if (usernameExist || IsForbiddenUsernames) {
		let increment = 1;
		while (true) {
			var u = username + increment;
			usernameExist = await model.findOne({ username: u });
			IsForbiddenUsernames = forbiddenUsernames.includes(u);
			console.trace("Looping at 'usernameGenerating' func to generate username");

			if (!usernameExist && !IsForbiddenUsernames) {
				break;
			} else {
				increment++;
			}
		}
		username = u;
	}

	return username;
}



function generatePassword(length) {
	length = length || 10;
	let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$_&-+()/*:;!?";
	let retVal = "";
	for (var i = 0, n = charset.length; i < length; ++i) {
		retVal += charset.charAt(Math.floor(Math.random() * n));
	}
	return retVal;
}

// get specific random digits
function randomDigit(length) {
	let result = "";
	const characters = "0123456789";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

async function userLoginSessionCreate(userId,token, expireInDay) {
	expireInDay = expireInDay || 30;
	const sessionUUID = uuid();
	
	const expiredAt = new Date();
	expiredAt.setDate(expiredAt.getDate() + expireInDay);

	const sessionStructure = new UserSession({
		user: userId,
		sessionName: "UserLoginSession",
		uuid: token,
		expiredAt,
		sessionUUID
	});

	const session = await sessionStructure.save();
	return session;
}





function NumberValidation(mobile) {
	const response = {
		message: "",
		valid: false,
	};

	const num = /^\d+$/.test(mobile);
	if (num) {
		if (mobile.length === 11) {
			
				response.message = "Valid number";
				response.valid = true;
			
		} else {
			response.message = "Number should be 11 digit!";
		}
	} else {
		response.message = "Please provide number chars";
	}

	return response;
}



module.exports = { isValidEmail,  usernameGenerating,  generatePassword, randomDigit, userLoginSessionCreate,  NumberValidation};