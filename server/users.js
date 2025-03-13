const users = [];
const rooms = new Map(); // Track rooms with active users

const addUser = ({ id, username, room, publicKey }) => {
  // Validate inputs
  if (!id) return { error: 'Socket ID is required' };
  
  // Handle undefined or empty values with defaults
  const processedUsername = username ? username.trim().toLowerCase() : `user-${id.substring(0, 5)}`;
  const processedRoom = room ? room.trim().toLowerCase() : 'default-room';
  
  // Check if user already exists
  const existingUser = users.find(
    (user) => user.room === processedRoom && user.username === processedUsername
  );

  if (existingUser) {
    return { error: 'Username is taken' };
  }

  // Create user
  const user = { 
    id, 
    username: processedUsername, 
    room: processedRoom, 
    publicKey: publicKey
  };
  
  users.push(user);
  
  // Update room tracking
  if (!rooms.has(processedRoom)) {
    rooms.set(processedRoom, {
      name: processedRoom,
      createdAt: new Date().toISOString(),
      userCount: 0
    });
  }
  
  // Increment user count in room
  const roomInfo = rooms.get(processedRoom);
  roomInfo.userCount += 1;
  rooms.set(processedRoom, roomInfo);
  
  console.log(`Added user: ${user.username} to room: ${user.room}`);
  console.log(`Active rooms: ${Array.from(rooms.keys()).join(', ')}`);
  
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    const user = users.splice(index, 1)[0];
    
    // Update room tracking when user leaves
    if (user && user.room && rooms.has(user.room)) {
      const roomInfo = rooms.get(user.room);
      roomInfo.userCount -= 1;
      
      // Remove room if empty
      if (roomInfo.userCount <= 0) {
        rooms.delete(user.room);
        console.log(`Room deleted: ${user.room} (no users)`);
      } else {
        rooms.set(user.room, roomInfo);
      }
    }
    
    return user;
  }
};

const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (room) => users.filter((user) => user.room === room);

const getRooms = () => Array.from(rooms);

const getPublicKeysInRoom = (room) => {
  const publicKeys = {};
  users
    .filter((user) => user.room === room)
    .forEach((user) => {
      publicKeys[user.username] = user.publicKey;
    });
  return publicKeys;
};

module.exports = { 
  addUser, 
  removeUser, 
  getUser, 
  getUsersInRoom, 
  getRooms,
  getPublicKeysInRoom 
};