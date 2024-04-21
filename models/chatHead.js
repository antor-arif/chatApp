const { Schema, model } = require("mongoose");

const ChatHeadSchema = new Schema(
	{
		participants: {
			type: [
				{
					user: {
						type: Schema.Types.ObjectId,
						ref: "users",
						required: true,
					},
				},
			],
		},
		lastMessageTime: {
			type: Date,
		},
		lastMessage: {
			type: String,
		},
		lastMessageSender: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: true,
		},
	},
	{ timestamps: true }
);

const ChatHead = model("ChatHead", ChatHeadSchema);

module.exports = ChatHead;
