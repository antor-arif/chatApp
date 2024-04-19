const { userAuthorization } = require("../middlewares/authorization");
const { onlineOfflineSignalEmit } = require("./func");
const User = require("../models/users");

// Define the socketServer function
const socketServer = async (io) => {
  // Connection authorization middleware
  io.use((socket, next) => {
    const req = socket.request;
    req.socketAuthToken = socket.handshake.auth.socketAuthToken;
    userAuthorization(req, {}, next);
  });

  // Middleware to update user's socketId
  io.use(async (socket, next) => {
    try {
      const user = socket.request.user;
      user.socketId = socket.id;
      await user.save();
      return next();
    } catch (error) {
      return next(error);
    }
  });

  // Handle socket connection and disconnection
  io.on("connection", async (socket) => {
    const user = socket.request.user;

    // Notify the user that they are connected
    socket.emit("socket is connected");

    // Handle any events emitted by the user
    socket.onAny((event, ...args) => {
      console.log({ event, args });
    });

    // Handle user disconnection
    socket.on("disconnect", async () => {
      try {
        const userId = user._id;

        // Leave any rooms the user may have been part of
        socket.leave(userId);

        // Update user status
        user.socketId = null;
        user.lastOnline = new Date();
        await user.save();

        // Notify the user's connections of disconnection
        const connections = user.connections.map(connection => connection.id);

        // Emit offline notification to each user in the connection list
        for (const connectionId of connections) {
          const connection = await User.findById(connectionId);
          if (connection && connection.socketId) {
            io.to(connection.socketId).emit("user_offline", userId);
          }
        }

        // Emit offline signal for further processing
        await onlineOfflineSignalEmit("offline", userId);
      } catch (error) {
        console.log(error);
      }
    });

    // Notify the user's connections of connection
    const connections = user.connections.map(connection => connection.id);

    // Emit online notification to each user in the connection list
    for (const connectionId of connections) {
      const connection = await User.findById(connectionId);
      if (connection && connection.socketId) {
        io.to(connection.socketId).emit("user_online", user._id);
      }
    }

    // Emit online signal for further processing
    await onlineOfflineSignalEmit("online", user._id);
  });
};

// Export the function for use in the main server file
module.exports = socketServer;
