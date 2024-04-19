const Workspace = require("../models/Workspace");
const User = require("../models/users");
const { Types } = require("mongoose");

const onlineOfflineSignalEmit = async (eventName, userId) => {
	const user = await User.findOne({ _id: userId }).select("fullName username email");

		const data = user;
		io.to(user.socketId).emit(eventName, data);
	
};

module.exports = { onlineOfflineSignalEmit };