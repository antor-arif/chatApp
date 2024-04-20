const authRouter = require("./auth");
const baseRouter = require("./base");

const indexRouter = require("express").Router();


indexRouter.use(baseRouter)
indexRouter.use("/api/auth", authRouter)



module.exports = indexRouter;