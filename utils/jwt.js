const jwt = require("jsonwebtoken");

/**
 * Create a JWT token
 *
 * @param {String} id User ID
 * @param {STring} sessionId Session id of this token
 * @returns JWT token
 */
function createToken(userInfo) {
	return jwt.sign(
		{
			userInfo
		},
		process.env.JWT_SECRET
	);
}

/**
 * Parse JWT
 *
 * @param {String} token Json Web Token
 * @returns Data of this token
 */
function parseJWT(token) {
	try {
		const splitToken = token.split(" ")[1]
		
		return jwt.verify(splitToken, process.env.JWT_SECRET);
	} catch (err) {
		return { error: err.message };
	}
}

module.exports = { createToken, parseJWT };