const {Schema,model}=require("mongoose")




const userSessionSchema = new Schema({
    user:{
        type: String
    },
    uuid:{
        type: String
    },
    expiredAt:{
        type: Date
    }
},{timestamps: true})



const SessionModel = model("session", userSessionSchema);


module.exports = SessionModel;