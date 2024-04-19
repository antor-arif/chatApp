const { Schema, model } = require("mongoose");

const chatSchema = new Schema(
	{
		sender: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: true,
		},
		to: {
			type: Schema.Types.ObjectId,
			ref: "users",
			required: true,
		},
		replayOf: {
			type: Schema.Types.ObjectId,
			ref: "Chat",
		},
		seen: {
			time:{
                type: Date
            },
			select: false,
		},
		deleted: {
			type: Boolean,
			default: false,
			select: false,
		},
		editedAt: Date,
        edited:{
            type: Boolean,
            default: false,
            select: false,
        },
        content:{
            type: String
        },
        chatHeadRef:{
            type: Schema.Types.ObjectId,
			ref: "ChatHead",
			required: true,
        }
	},
	{
		timestamps: true,
	}
);

const Chat = model("Chat", chatSchema);

module.exports = Chat;