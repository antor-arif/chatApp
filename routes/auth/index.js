const { registerUser } = require("../../controllers/auth");
const multipart = require("connect-multiparty")
const authRouter = require("express").Router();




authRouter.post("/register",multipart(), registerUser);



module.exports = authRouter;