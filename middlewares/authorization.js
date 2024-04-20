const SessionModel = require("../models/userSession")
const { parseJWT } = require("../utils/jwt")

exports.userAuthorization = async (req, res, next) => {
  const token = req.headers.authorization;
  let issue = {}

  if (!token) {
    issue.error = "Please provide token in headers.authorization...."
    return res.status(400).json(issue)
  }

  const parseToken = await parseJWT(token)

  if (parseToken.error) {
    issue.error = parseToken.error
    return res.status(400).json(issue)
  }

  const payload = parseToken.userInfo
  const splitToken = token.split(" ")[1]

  const checkSession = await SessionModel.findOne({ $and: [{ user: payload.email }, { uuid: splitToken }] })

  if (!checkSession) {
    issue.error = "Please login again"
    return res.status(400).json(issue)
  }

  const currentTime = new Date

  if (checkSession.expiredAt > currentTime) {
    req.user = payload;
    req.token = splitToken
    next();
  } else {
    issue.error = "Session expired. Please login again"
    return res.status(400).json(issue)
  }
}
