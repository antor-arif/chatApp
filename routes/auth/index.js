const { registerUser, loginUser } = require("../../controllers/auth");
const multipart = require("connect-multiparty")
const authRouter = require("express").Router();




authRouter.post("/register",multipart(), registerUser);
authRouter.post("/login", loginUser);



module.exports = authRouter;