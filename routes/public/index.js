const { SearchUser } = require("../../controllers/public");

const publicRouter = require("express").Router();

publicRouter.post("/search-user", SearchUser);

module.exports = publicRouter;
