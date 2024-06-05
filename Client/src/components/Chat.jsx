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
    const ENDPOINT = 'http://localhost:5000';

    useEffect(() => {
        const { name, room } = queryString.parse(window.location.search);

        socket = io(ENDPOINT);

        setName(name);
        setRoom(room);

        socket.emit('join', { name, room }, (error) => {
            if (error) {
                alert(error);
            }
        });

        // return () => {
        //     socket.emit('disconnect');
        //     socket.off();
        // };
    }, [ENDPOINT, window.location.search]);

    useEffect(() => {
        socket.on('message', (message) => {
            setMessages((messages) => [...messages, message]);
        });

        return () => {
            socket.off('message');
        };
    }, []);

    const sendMessage = (event) => {
        event.preventDefault();

        if (message) {
            socket.emit('sendMessage', message, () => setMessage(''));
        }
    };

    return (
        <div className='flex justify-center h-screen items-center text-center bg-slate-200 w-full'>
            <div className=' h-96 w-96 flex flex-col justify-between'>
                <InfoBar room={room} />
                <div className=''>
                     <Messages messages={messages} name={name} />
                <div>
                  <Input message={message} setMessage={setMessage} sendMessage={sendMessage}></Input>
                </div>
                </div>
               
                
            </div>
        </div>
    );
};

export default Chat;
