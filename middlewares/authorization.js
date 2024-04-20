
const SessionModel = require("../models/userSession")
const { parseJWT } = require("../utils/jwt")

exports.userAuthorization=async(req,res,next)=>{
    let issue={}
  if (token) {
    const parseToken = await parseJWT(token)
    const payload = parseToken.payload
    if (!parseToken.error) {
          const checkSession = await SessionModel.findOne({$and:[{user:payload.email},{sessionUUID: payload.sessionUUID},{uuid: token}]})
          if (checkSession) {
                req.user = payload;
                next();
          } else {
            issue.error = "Please login again"
          }
    } else {
        issue.error = parseToken.message
    }

  } else {
    issue.error = "Please provide token in headers.authorization...."
  }
}