const ChatHead = require("../../models/chatHead");
const User = require("../../models/users");

exports.connectUser = async(req,res,next)=>{
    let userId = req.params.id;
    const user = req.user;
    let issue = {};
    if (userId) {
        const isValidID = isValidObjectId(userId);
        if (isValidID) {
           userId = userId 
        } else {
            issue.error= "Invalid user ID"
        }
    } else {
        issue.error = "You must need provide user ID"
    }
    try {
        const findUser = await User.findOne({_id: userId})
        if (findUser) {
            const updateConnectionOfUser = await User.updateOne({_id:userId},{$push:{connections:{id: user._id}}})
            const updateConnectionOfOwn = await User.updateOne({_id:user._id},{$push:{connections:{id: userId}}})
            if (updateConnectionOfOwn && updateConnectionOfUser) {
                return res.status(200).json({
                    message: "User added to connection"
                })
            } else {
                issue.error = "User not added to connection"
            }
        } else {
            issue.error = "User not found"
        }
        return res.status(400).json({ issue })
    } catch (error) {
        next(error)
    }
}

exports.getConnectedUsers = async(req,res,next)=>{
    const user = req.user;
    let issue={};
    try {
        const getUsersConnections = await User.findOne({_id: user._id}).populate({path:"connections", select: "name avatar"})
        if (getUsersConnections.length > 0) {
            let chats = [];
            for (const connection of getUsersConnections) {
                const findChat = await ChatHead.findOne({participants:{$in:[{user: user._id},{user: connection._id}]}});
                chats.push({connection: connection, chatHead: findChat})
            }
            return res.status(200).json({data: chats})
        } else {
            issue.error = "No connected user....Add user to chat."
        }
        return res.status(400).json({issue})
    } catch (error) {
        next(error)
    }
}