const { registerUser, loginUser, logoutUser, updateUserProfile } = require("../../controllers/auth");
const multipart = require("connect-multiparty");
const { userAuthorization } = require("../../middlewares/authorization");
const authRouter = require("express").Router();

authRouter.post("/register", multipart(), registerUser);
authRouter.post("/login", loginUser);
authRouter.delete("/logout", userAuthorization, logoutUser);
authRouter.patch("/update-profile", userAuthorization, multipart(), updateUserProfile);

module.exports = authRouter;
