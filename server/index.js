const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");

const server = http.createServer(app);

const io = new Server(server);

const userSocketMap = {};
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  // console.log('Socket connected', socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // notify that new user join
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // sync the code
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  // when new user join the room all the code which are there are also shows on that persons editor
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // Group messaging feature
  socket.on(ACTIONS.SEND_MESSAGE, ({ roomId, message, sender }) => {
    io.in(roomId).emit(ACTIONS.NEW_MESSAGE, { message, sender });
  });

  // Audio sharing feature
  socket.on(ACTIONS.START_AUDIO, ({ roomId, userId }) => {
    socket.to(roomId).emit(ACTIONS.USER_STARTED_AUDIO, { userId });
  });

  socket.on(ACTIONS.STOP_AUDIO, ({ roomId, userId }) => {
    socket.to(roomId).emit(ACTIONS.USER_STOPPED_AUDIO, { userId });
  });

  socket.on(ACTIONS.AUDIO_DATA, ({ roomId, audioChunk, userId }) => {
    socket.to(roomId).emit(ACTIONS.RECEIVE_AUDIO_DATA, { audioChunk, userId });
  });

  // leave room
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    // leave all the room
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
