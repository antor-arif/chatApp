const {Schema,model} = require("mongoose");


const userSchema = new Schema({
    name:{
        type: String,
        require: true
    },
    username:{
        type: String,
        require: true,
        unique: true,
    },
    phone: {
        type: String,
        unique: true
    },
    email:{
        type: String,
        require: true,
        unique: true
    },
    avatar:{
        type: String
    },
    password:{
        type: String
    },
    socketId:{
        type: String
    },
    lastOnline:{
        type: Date,
    },
    connections:[
        {
            id: {
                type: Schema.Types.ObjectId,
                ref: "users"
            }
        }
    ]
},{timestamps: true})

const User = model("users", userSchema);

module.exports = User;