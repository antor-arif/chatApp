const http = require("http");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config/cloudinary")();
require("./config/database");
const indexRouter = require("./routes/index");

const app = express();

const server = http.createServer(app);

// Socket Server
const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});
global.io = io;

// socket server binding
const socketServer = require("./socket/socket-server");
socketServer(io);

// Middleware Array
const middleware = [ cors(), express.static("public"), express.urlencoded({ extended: true }), express.json()];
app.use(middleware);
// console.clear();

app.use(indexRouter);



const port = process.env.PORT || 5000;

server.listen(port, () => {
	console.log("Server running on port:" + port);
});

