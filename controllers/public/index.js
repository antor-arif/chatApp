const { isValidObjectId } = require("mongoose");
const User = require("../../models/users");

exports.SearchUser = async(req,res,next)=>{
    let {search, skip, limit} = req.query;
    const query = [];
    let issue={} ;
    if (search) {
        const keyWordRegExp = new RegExp(".*" + search + ".*", "i"); 
        query.push({name: keyWordRegExp})
        query.push({username: keyWordRegExp})
        query.push({email: keyWordRegExp})
    } else {
        issue.error = "You need to provide a value in search";
    }
    if (skip) {
        skip = parseInt(skip);
    }else{
          skip = 0;
    }
    if (limit) {
        limit = parseInt(limit)
    } else {
        limit = 10;
    }
    try {
        const findUsers = await User.find({$or: query}).skip(`${skip}`).limit(`${limit}`).select({password: 0})
        if (findUsers.length > 0) {
            return res.status(200).json({
                data: findUsers
            })
        } else {
            issue.error = "No user found.."
        }
        return res.status(200).json({issue})
    } catch (error) {
        next(error)
    }
}
