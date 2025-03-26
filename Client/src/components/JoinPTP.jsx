import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, LogIn, Undo2 } from 'lucide-react';

const JoinRoom = ({ onJoinRoom, rooms = [], loading = false, error = null }) => {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');

  const joinRoom = () => {
    if (username && room) {
      onJoinRoom(username, room);
    }
  };

  // Always show error if username or room is empty
  const displayError = !username || !room ? "Username and room name are required!" : error;

  return (
    <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="bg-white shadow-2xl rounded-2xl px-8 pt-6 pb-8 mb-4 w-full max-w-md">
        <Link to="/">
          <Undo2 className="relative text-indigo-800"/>
        </Link>
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-800">
          Join a Chat Peer to Peer
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Users size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room
            </label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            />
          </div>

          {rooms && rooms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Rooms
              </label>
              <div className="flex flex-wrap gap-2">
                {rooms.map(([roomName, roomInfo], index) => (
                  <button
                    key={index}
                    onClick={() => setRoom(roomName)}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-full text-sm transition-colors duration-200"
                  >
                    {roomName} ({roomInfo.userCount})
                  </button>
                ))}
              </div>
            </div>
          )}

          {displayError && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              {displayError}
            </div>
          )}

          <button
            onClick={joinRoom}
            disabled={loading || !username || !room}
            className={`w-full px-4 py-2 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 flex items-center justify-center ${
              (loading || !username || !room) ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <LogIn size={18} className="mr-2" />
            {loading ? "Joining..." : "Join Room"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;