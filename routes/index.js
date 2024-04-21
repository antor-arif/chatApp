const { userAuthorization } = require("../middlewares/authorization");
const authRouter = require("./auth");
const baseRouter = require("./base");
const publicRouter = require("./public");
const userRouter = require("./user");

const indexRouter = require("express").Router();

indexRouter.use(baseRouter);
indexRouter.use("/api/auth", authRouter);
indexRouter.use("/api/user", userAuthorization, userRouter);
indexRouter.use("/api/public", publicRouter);

// catch 404 and forward to error handler
indexRouter.use((req, res, next) => {
	return res.status(404).json({
		issue: {
			error: "404 | Resource not found!",
		},
	});
});

// error handler
indexRouter.use((err, req, res, next) => {
	console.error(err);

	const statusCode = err.status || 500;
	const issue = {};

	issue.error = `${err.message}`;

	return res.status(statusCode).json({ issue });
});

module.exports = indexRouter;
