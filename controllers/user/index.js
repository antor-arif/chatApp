const { isValidObjectId } = require("mongoose");
const ChatHead = require("../../models/chatHead");
const User = require("../../models/users");
const Block = require("../../models/blocked");
const Chat = require("../../models/chat");

// Connect with a user.....

exports.connectUser = async (req, res, next) => {
	let userId = req.params.id;
	const user = req.user;
	let issue = {};
	if (userId) {
		const isValidID = isValidObjectId(userId);
		if (isValidID) {
			userId = userId;
		} else {
			issue.error = "Invalid user ID";
		}
	} else {
		issue.error = "You must need provide user ID";
	}
	try {
		const findUser = await User.findOne({ _id: userId });
		if (findUser) {
			const updateConnectionOfUser = await User.updateOne({ _id: userId }, { $push: { connections: { id: user._id } } });
			const updateConnectionOfOwn = await User.updateOne({ _id: user._id }, { $push: { connections: { id: userId } } });
			const createChatHead = new ChatHead({
				participants: [{ user: user._id }, { user: userId }],
			});
			const saveChatHead = await createChatHead.save();
			if (updateConnectionOfOwn && updateConnectionOfUser && saveChatHead) {
				return res.status(200).json({
					message: "User added to connection",
				});
			} else {
				issue.error = "User not added to connection";
			}
		} else {
			issue.error = "User not found";
		}
		return res.status(400).json({ issue });
	} catch (error) {
		next(error);
	}
};

// Get Connections

exports.getConnectedUsers = async (req, res, next) => {
	const user = req.user;
	let issue = {};
	try {
		const getUsersConnections = await User.findOne({ _id: user._id }).populate({ path: "connections", select: "name avatar" });
		if (getUsersConnections.length > 0) {
			let chats = [];
			for (const connection of getUsersConnections) {
				const findChat = await ChatHead.findOne({ participants: { $all: [{ "participants.user": user._id }, { "participants.user": connection._id }] } });
				chats.push({ connection: connection, chatHead: findChat });
			}
			return res.status(200).json({ data: chats });
		} else {
			issue.error = "No connected user....Add user to chat.";
		}
		return res.status(400).json({ issue });
	} catch (error) {
		next(error);
	}
};

// Send Message

exports.sendMessage = async (req, res, next) => {
	const user = req.user;
	let sendTo = req.params.id;
	let { message, replyOf } = req.body;
	let { image } = req.files;

	let issue = {};

	if (!message && !image) {
		issue.error = "Forbidden..You can send a blank message..";
	}

	//check the user ID
	if (sendTo) {
		const isValidId = isValidObjectId(sendTo);
		if (isValidId) {
			sendTo = sendTo;
		} else {
			issue.error = "Invalid object ID";
		}
	} else {
		issue.error = "User ID is required";
	}

	// check the reply message ID;

	if (replyOf) {
		const isValidId = isValidObjectId(replyOf);
		if (isValidId) {
			const findTheirChatHead = await ChatHead.findOne({
				"participants.user": { $all: [user._id, sendTo] },
			});
			const chatExists = await Chat.findOne({ $and: [{ _id: replyOf }, { chatHeadRef: findTheirChatHead._id }, { deleted: false }] });
			if (chatExists) {
				replyOf = replyOf;
			} else {
				issue.error = "The message are trying to reply doesn't exists";
			}
		} else {
			issue.error = "Invalid object ID";
		}
	}

	if (image) {
		const checkImage = imageCheck(image);
		if (checkImage.status) {
			var uploadResult = await upload(image.path);
			if (uploadResult.secure_url) {
				image = uploadResult.secure_url;
			} else {
				issue.error = uploadResult.message;
			}
		} else {
			issue.error = checkImage.message;
		}
	}

	try {
		const findTheUser = await User.findOne({ _id: sendTo });
		if (findTheUser) {
			const findIfIBlocked = await Block.findOne({ $and: [{ by: user._id }, { to: sendTo }] });
			if (!findIfIBlocked) {
				const findIfThemBlock = await Block.findOne({ $and: [{ by: sendTo }, { to: user._id }] });
				if (!findIfThemBlock) {
					const findTheirChatHead = await ChatHead.findOne({
						"participants.user": { $all: [user._id, sendTo] },
					});

					const newChat = new Chat({
						sender: user._id,
						to: sendTo,
						replyOf: replyOf,
						content: image,
						chatHeadRef: findTheirChatHead._id,
						content: message,
					});

					const saveChat = await newChat.save();
					if (findTheUser.socketId !== null || !findTheUser.socketId) {
						const ownSocketId = await User.findOne({ _id: user._id }).select({ socketId: 1 });
						global.io.to(findTheUser.socketId).to(ownSocketId.socketId).emit("NEW_MESSAGE_RECEIVED", newChat.content);
					}
					return res.status(201).json({
						message: "Message sent",
						data: saveChat.content,
					});
				} else {
					issue.message = "This contact has blocked you";
				}
			} else {
				issue.error = "You have blocked this contact";
			}
		} else {
			issue.error = "User doesn't exists";
		}
		res.status(400).json(issue);
	} catch (error) {
		next(error);
	}
};
