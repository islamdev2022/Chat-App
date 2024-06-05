import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {toast,ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const Join = () => {
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');

    useEffect(() => {
        console.log('join');
    }, []);

    function emptyFields() {
        if (!name || !room) {
            toast.error('Please fill in all fields');
            console.log('Please fill in all fields');
            return true;
        }
    }

    return (
        <div className='flex justify-center h-screen items-center text-center bg-slate-200'>
            <div className='flex flex-col gap-3 bg-white p-3 rounded-xl shadow-xl'>
                <p className="text-blue-800 font-bold p-2">Join a Chat</p>
                <div>
                    <input 
                    className='p-2 outline-slate-500 border'
                        type="text" 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder="Username" 
                    />
                </div>
                <div>
                    <input 
                    className='p-2 outline-slate-500 border'
                        type="text" 
                        onChange={(e) => setRoom(e.target.value)} 
                        placeholder="Room Name" 
                    />
                </div>
                <div>
                     <Link 
                    onClick={e => (!name || !room) ? e.preventDefault() : null} 
                    to={`/chat?name=${name}&room=${room}`}
                >
                    <button className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded-md shadow-xl" onClick={emptyFields}>
                        Sign In
                    </button>
                </Link>
                </div>
               
            </div>
            <toastContainer position="top-right"/>
        </div>
    );
}

export default Join;
