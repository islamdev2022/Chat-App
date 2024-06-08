import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
const Join = () => {
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');
    const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    useEffect(() => {
        // Fetch available rooms from the server
        axios.get('https://chat-app-server-eight-liard.vercel.app/rooms')
          .then(response => {
            setRooms(response.data);
          })
          .catch(error => {
            console.error('There was an error fetching the rooms!', error);
          });
      }, []);

      const handleRoomChange = (event) => {
        const selectedRoom = event.target.value;
        if (selectedRoom === 'newRoom') {
          setIsCreatingRoom(true);
          setRoom('');
        } else {
          setIsCreatingRoom(false);
          setRoom(selectedRoom);
        }
      };

    function emptyFields() {
        if (!name || (!room && !newRoom)) {
            alert('Please fill in all fields');
            return true;
        }
    }

    return (
        <div className='flex justify-center h-screen items-center text-center bg-slate-200'>
            <form className='flex flex-col gap-5 bg-white px-6 py-8 rounded-xl shadow-xl'>
                <p className="text-blue-800 text-2xl font-bold p-2">Join a Chat</p>
                <div>
                    <input 
                    className='p-2 outline-slate-500 border rounded'
                        type="text" 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Username" 
                    />
                </div>
                <div>
          <select
            className=" cursor-pointer p-2 outline-slate-500 w-full text-slate-400 border rounded"
            value={room}
            onChange={handleRoomChange}
          >
            <option value="" disabled>Select a room</option>
            {rooms.map((room) => (
              <option key={room} value={room}>{room}</option>
            ))}
            <option value="newRoom">Create a new room</option>
          </select>
        </div>
        {isCreatingRoom && (
          <div>
            <input
              placeholder="New Room Name"
              className="p-2 outline-slate-500 border rounded"
              type="text"
              onChange={(event) => setNewRoom(event.target.value)}
            />
          </div>
        )}
        <div>
             <Link
          onClick={e => (!name || (!room && !newRoom)) ? e.preventDefault() : null}
          to={`/chat?name=${name}&room=${isCreatingRoom ? newRoom : room}`}
        >
          <button className={'bg-blue-700 hover:bg-blue-600 text-white font-bold py-1 text-lg px-4 rounded-md shadow-xl'} type="submit" onClick={emptyFields}>Sign In</button>
        </Link>
        </div>
       
               
            </form>
        </div>
    );
}

export default Join;
