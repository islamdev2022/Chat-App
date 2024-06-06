let users = [];
let rooms = new Set();

const addUser = ({ id, username, room }) => {
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  const existingUser = users.find((user) => user.room === room && user.username === username);

  if (!username || !room) return { error: 'Username and room are required.' };
  if (existingUser) return { error: 'Username is already taken.' };

  const user = { id, username, room };
  users.push(user);
  rooms.add(room);

  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);

  if (index !== -1) {
    const user = users.splice(index, 1)[0];
    const usersInRoom = users.filter((user) => user.room === user.room);
    if (usersInRoom.length === 0) {
      rooms.delete(user.room);
    }
    return user;
  }
};

const getUser = (id) => users.find((user) => user.id === id);

const getUsersInRoom = (room) => users.filter((user) => user.room === room);

const getRooms = () => Array.from(rooms);

module.exports = { addUser, removeUser, getUser, getUsersInRoom, getRooms };
