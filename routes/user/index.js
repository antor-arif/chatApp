const { connectUser, getConnectedUsers, sendMessage, getMessages, RemoveMessage, EditMessage, BlockUser, UnblockUser } = require("../../controllers/user");
const multipart = require("connect-multiparty");
const userRouter = require("express").Router();

userRouter.post("/connect-user/:id", connectUser);
userRouter.get("/get-connected-user", getConnectedUsers);
userRouter.post("/send-message/:id", multipart(), sendMessage);
userRouter.get("/get-messages/:id", getMessages);
userRouter.delete("/remove-message/:id", RemoveMessage);
userRouter.patch("/edit-message/:id", EditMessage);
userRouter.post("/block-user/:id", BlockUser);
userRouter.post("/unblock-user/:id", UnblockUser);

module.exports = userRouter;
