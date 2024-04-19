const {Schema,model} = require("mongoose");


const blockedSchema = new Schema ({
    by:{
        type: Schema.Types.ObjectId,
        ref: "users",
        require: true
    },
    to:{
        type: Schema.Types.ObjectId,
        ref: "users",
        require: true
    }
},{timestamps: true})

const Block = model("block", blockedSchema);


module.exports = Block;