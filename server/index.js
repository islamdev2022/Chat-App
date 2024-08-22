const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const path = require('path');
const { addUser, removeUser, getUser, getUsersInRoom, getRooms } = require('./users');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.get('/rooms', (req, res) => {
  res.json(getRooms());
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.use("/" ,(req, res) => {
  res.send("Server is up and running.");
})



io.on('connection', (socket) => {
  console.log('We have a new connection!!!', socket.id);

  socket.on('join', ({ name, room }, callback) => {
    console.log('User joined with details:', { name, room });
    const { error, user } = addUser({ id: socket.id, username: name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'Admin', text: `${user.username}, welcome to the room ${user.room}` });
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.username} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', { user: user.username, text: message });
      callback();
    } else {
      console.error(`User not found for socket ID: ${socket.id}`);
      callback('User not found');
    }
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', { user: 'admin', text: `${user.username} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });
    }
    console.log('User has left!!!', socket.id);
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
