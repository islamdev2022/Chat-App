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
                    <input 
                    className='p-2 outline-slate-500 border rounded'
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
                    <button className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-1 text-lg px-4 rounded-md shadow-xl" onClick={emptyFields}>
                        Sign In
                    </button>
                </Link>
                </div>
               
            </form>
            <toastContainer position="top-right"/>
        </div>
    );
}

export default Join;
