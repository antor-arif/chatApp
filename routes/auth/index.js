const { registerUser } = require("../../controllers/auth");

const authRouter = require("express").Router();




authRouter.post("/register", registerUser);



module.exports = authRouter;