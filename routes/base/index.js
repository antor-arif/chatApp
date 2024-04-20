const baseRouter = require("express").Router();



baseRouter.get('/', (req,res)=>{
    res.status(200).send("Server is running........")
})
baseRouter.post('/', (req,res)=>{
    res.status(200).send("Server is running........")
})
baseRouter.patch('/', (req,res)=>{
    res.status(200).send("Server is running........")
})
baseRouter.delete('/', (req,res)=>{
    res.status(200).send("Server is running........")
})
baseRouter.put('/', (req,res)=>{
    res.status(200).send("Server is running........")
})


module.exports = baseRouter;
