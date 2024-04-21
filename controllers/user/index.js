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
	let subject;
	let issue = {};

	if (!message && !image) {
		issue.error = "Forbidden..You can send a blank message..";
	}

	if (message) {
		subject = message;
	}

	// Validation...

	if (message && image) {
		issue.error = "Either message or image can be send at one time";
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
				subject = uploadResult.secure_url;
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

					await ChatHead.findOneAndUpdate(
						{
							"participants.user": { $all: [user._id, sendTo] },
						},
						{ $set: { lastMessageSender: user._id, lastMessage: newChat.content, lastMessageTime: new Date() } }
					);

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

exports.getMessages = async (req, res, next) => {
	const user = req.user;
	let OtherUser = req.params.id;
	let { skip, limit } = req.query;

	let issue = {};
	// Check skip...
	if (skip) {
		skip = parseInt(skip);
	} else {
		skip = 0;
	}

	// check limit......
	if (limit) {
		limit = parseInt(limit);
	} else {
		limit = 20;
	}

	if (OtherUser) {
		const validateID = isValidObjectId(OtherUser);
		if (validateID) {
			const findUser = await User.findOne({ _id: OtherUser });
			if (findUser) {
				OtherUser = findUser._id;
			} else {
				issue.error = "User doesn't exists";
			}
		} else {
			issue.error = "Invalid User ID";
		}
	} else {
		issue.error = "You must need to provide user ID";
	}

	try {
		const findChatHead = await ChatHead.findOne({
			"participants.user": { $all: [user._id, OtherUser] },
		});
		if (findChatHead) {
			const chats = [];
			const getAllMessages = await Chat.find({ $and: [{ chatHeadRef: findChatHead._id }, { deleted: false }] })
				.skip(`${skip}`)
				.limit(`${limit}`)
				.sort({ createdAt: -1 })
				.populate({ path: "sender", select: "name avatar" });
			res.status(200).json({
				data: getAllMessages,
			});
			for (const otherUserSends of getAllMessages) {
				if (otherUserSends.sender._id.toString() === OtherUser.toString()) {
					chats.push(otherUserSends);
				}
			}
			for (const chat of chats) {
				await Chat.updateOne({ _id: chat._id }, { $set: { seen: true } });
			}
		} else {
			issue.error = "Chat history doesn't exists";
		}
		if (!res.headersSent) {
			return res.status(400).json(issue);
		}
	} catch (error) {
		next(error);
	}
};

// Remove Message.....

exports.RemoveMessage = async (req, res, next) => {
	const user = req.user;
	let messageID = req.params.id;
	let issue = {};

	// validate message.....

	if (messageID) {
		const validID = isValidObjectId(messageID);
		if (validID) {
			const messageExists = await Chat.findOne({ _id: messageID });
			if (messageExists) {
				if (messageExists.sender.toString() === user._id.toString()) {
					messageID = messageID;
				} else {
					issue.error = "You're not sender of this message.";
				}
			} else {
				issue.error = "Message doesn't exists";
			}
		} else {
			issue.error = "Invalid object ID";
		}
	} else {
		issue.error = "Message ID is required.";
	}

	try {
		const setTheMessageDeleted = await Chat.findOneAndUpdate({ _id: messageID }, { $set: { deleted: true } });
		if (setTheMessageDeleted) {
			return res.status(200).json({
				message: "Message Removed",
			});
		} else {
			issue.error = "Something went wrong.Message not deleted";
		}
		if (!res.headersSent) {
			res.status(400).json(issue);
		}
	} catch (error) {
		next(error);
	}
};

// Edit Message......

exports.EditMessage = async (req, res, next) => {
	const user = req.user;
	let messageID = req.params.id;
	let { message } = req.body;
	let issue = {};

	// validate message.....

	if (messageID) {
		const validID = isValidObjectId(messageID);
		if (validID) {
			const messageExists = await Chat.findOne({ _id: messageID });
			if (messageExists) {
				if (messageExists.sender.toString() === user._id.toString()) {
					messageID = messageID;
				} else {
					issue.error = "You're not sender of this message.";
				}
			} else {
				issue.error = "Message doesn't exists";
			}
		} else {
			issue.error = "Invalid object ID";
		}
	} else {
		issue.error = "Message ID is required.";
	}

	try {
		const UpdateTheMessage = await Chat.findOneAndUpdate({ _id: messageID }, { $set: { content: message } }, { new: true });
		if (setTheMessageDeleted) {
			return res.status(200).json({
				message: "Message updated",
				data: UpdateTheMessage.content,
			});
		} else {
			issue.error = "Something went wrong.Message not updated";
		}
		if (!res.headersSent) {
			return res.status(400).json(issue);
		}
	} catch (error) {
		next(error);
	}
};

// Block a user.......

exports.BlockUser = async (req, res, next) => {
	const user = req.user;
	let OtherUser = req.params.id;

	let issue = {};

	if (OtherUser) {
		const validateID = isValidObjectId(OtherUser);
		if (validateID) {
			const findUser = await User.findOne({ _id: OtherUser });
			if (findUser) {
				OtherUser = findUser._id;
			} else {
				issue.error = "User doesn't exists";
			}
		} else {
			issue.error = "Invalid User ID";
		}
	} else {
		issue.error = "You must need to provide user ID";
	}
	try {
		const newBlock = new Block({
			by: user._id,
			to: OtherUser,
		});
		const saveBlock = await newBlock.save();
		if (saveBlock) {
			return res.status(200).json({
				message: "User blocked successfully",
			});
		} else {
			issue.error = "Failed to block user";
		}
		if (!res.headersSent) {
			res.status(400).json(issue);
		}
	} catch (error) {
		next(error);
	}
};

exports.UnblockUser = async (req, res, next) => {
	const user = req.user;
	let OtherUser = req.params.id;

	let issue = {};

	if (OtherUser) {
		const validateID = isValidObjectId(OtherUser);
		if (validateID) {
			const findUser = await User.findOne({ _id: OtherUser });
			if (findUser) {
				OtherUser = findUser._id;
			} else {
				issue.error = "User doesn't exists";
			}
		} else {
			issue.error = "Invalid User ID";
		}
	} else {
		issue.error = "You must need to provide user ID";
	}
	try {
		const haveIBlocked = await Block.findOne({ $and: [{ by: user._id }, { to: OtherUser }] });
		if (haveIBlocked) {
			const UnblockTheUser = await Block.deleteOne({ $and: [{ by: user._id }, { to: OtherUser }] });
			if (UnblockTheUser) {
				return res.status(200).json({
					message: "Successfully unblocked user",
				});
			} else {
				issue.error = "Failed unblocked user";
			}
		} else {
			issue.error = "You are not the blocker";
		}
		if (!res.headersSent) {
			res.status(400).json(issue);
		}
	} catch {
		next(error);
	}
};
