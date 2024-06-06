import React, { useState, useEffect } from 'react';
import queryString from 'query-string';
import io from 'socket.io-client';
import InfoBar from './InfoBar';
import Input from './Input';
import Messages from './Messages';

let socket;

const Chat = () => {
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const ENDPOINT = 'http://localhost:5000';

    useEffect(() => {
        const { name, room } = queryString.parse(window.location.search);
        console.log('Joining with:', { name, room });
        socket = io(ENDPOINT);
        setName(name);
        setRoom(room);

        socket.emit('join', { name, room }, (error) => {
            if (error) {
                alert(error);
            }
        });

        return () => {
            socket.disconnect();
            socket.off();
        };
    }, [ENDPOINT, window.location.search]);

    useEffect(() => {
        socket.on('message', (message) => {
            console.log('Received message:', message);
            setMessages((messages) => [...messages, message]);
        });

        socket.on('roomData', ({ users }) => {
            console.log('Room data:', users);
            setUsers(users);
        });

        return () => {
            socket.off('message');
            socket.off('roomData');
        };
    }, []);

    const sendMessage = (event) => {
        event.preventDefault();

        if (message) {
            console.log('Sending message:', message);
            socket.emit('sendMessage', message, () => setMessage(''));
        }
    };

    return (
        <div className='flex justify-center h-screen items-center text-center bg-slate-200 w-full'>
            <div className='md:h-2/3 h-full w-full md:w-96 flex flex-col justify-between bg-white rounded-xl'>
                <InfoBar room={room} name={name} users={users} />
                <div className='flex flex-col h-full'>
                    <Messages messages={messages} name={name} />
                    <Input message={message} setMessage={setMessage} sendMessage={sendMessage} />
                </div>
            </div>
        </div>
    );
};

export default Chat;
