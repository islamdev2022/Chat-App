const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const path = require('path');
const { 
  addUser, 
  removeUser, 
  getUser, 
  getUsersInRoom, 
  getRooms,
  getPublicKeysInRoom
} = require('./users');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
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

  socket.on('join', ({ name, room, publicKey }, callback) => {
    console.log('User attempting to join:', { name, room, socketId: socket.id });
    const { error, user } = addUser({ 
      id: socket.id, 
      username: name, 
      room, 
      publicKey 
    });
    if (error) {
      console.error('Join error:', error);
      if (callback) return callback(error);
      return;
    }

    socket.join(user.room);
    // console.log(`Socket ${socket.id} with name ${name} joined room: ${user.room}`);
    console.log('Users in room:', getUsersInRoom(user.room));
    console.log("here it deleted the user", user);  
    // socket.to(user.room).emit('join', socket.id); // the user get deleted here why ?
    console.log(`User ${name} joined room ${room}`);
    if (callback) {
      // console.log(callback)
      console.log('Join callback:', user);
      callback();}

    socket.on('signal', ({ to, signal }) => {
      console.log(`Signal from ${socket.id} to ${to}`);
      io.to(to).emit('signal', { to: socket.id, signal });
    });

    if (error) {
      console.log('Join error:', error);
      return callback(error);}
    
      console.log('Join success:', user);
    socket.join(user.room);

    // Welcome message for the new user
    socket.emit('message', { 
      user: 'Admin', 
      text: `${user.username}, welcome to the room ${user.room}` 
    });
    
    // Notify others that a new user has joined
    socket.broadcast.to(user.room).emit('message', { 
      user: 'admin', 
      text: `${user.username} has joined!` 
    });

    // Send room user data
    io.to(user.room).emit('roomData', { 
      room: user.room, 
      users: getUsersInRoom(user.room) 
    });
    
    // Send public keys to all users in the room
    io.to(user.room).emit('publicKeys', getPublicKeysInRoom(user.room));
    
    callback();
  });

  socket.on('sendMessage', (messagePackage, callback) => {
    const user = getUser(socket.id);
    const message = typeof messagePackage === 'string' ? JSON.parse(messagePackage) : messagePackage;
    if (user) {
      if (message.recipients){
        // Forward the encrypted message
      io.to(user.room).emit('message', { 
        user: user.username, 
        text: messagePackage,
        encrypted: true  // Flag to indicate this is an encrypted message
      });
      }else {
        // Handle regular messages (like system messages)
        io.to(user.room).emit('message', { 
            user: user.username, 
            text: messagePackage 
        });
    }
      
      callback();
    } else {
      console.error(`User not found for socket ID: ${socket.id}`);
      callback('User not found');
    }
  });

  socket.on('requestPublicKeys', (callback) => {
    const user = getUser(socket.id);
    
    if (user) {
      // Send the public keys to the requesting user
      socket.emit('publicKeys', getPublicKeysInRoom(user.room));
      callback();
    } else {
      callback('User not found');
    }
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', { 
        user: 'admin', 
        text: `${user.username} has left.` 
      });
      
      io.to(user.room).emit('roomData', { 
        room: user.room, 
        users: getUsersInRoom(user.room) 
      });
      
      // Update public keys for remaining users
      io.to(user.room).emit('publicKeys', getPublicKeysInRoom(user.room));
    }
    console.log('User has left!!!', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));