import React, { useState, useEffect, useCallback,useRef } from 'react';
import queryString from 'query-string';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import elliptic from 'elliptic';
import InfoBar from './InfoBar';
import Input from './Input';
import Message from './Message';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Users } from 'lucide-react';

// Initialize elliptic curve
const EC = new elliptic.ec('secp256k1');
let socket;

const Chat = () => {
    const [name, setName] = useState('');
    const [room, setRoom] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [keyPair, setKeyPair] = useState(null);
    const [publicKeys, setPublicKeys] = useState({});

  const messagesEndRef = useRef(null);
    const ENDPOINT = import.meta.env.VITE_SERVER_URL
    
      // Scroll to bottom when messages change
      useEffect(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
      }, [messages]);

    // Generate or retrieve key pair
    const generateKeyPair = useCallback(() => {
        // Check if we already have a key pair in session storage
        const storedPrivateKey = sessionStorage.getItem(`privateKey-${name}-${room}`);
        
        if (storedPrivateKey) {
            try {
                // If we have a stored key pair, use it
                const loadedKeyPair = EC.keyFromPrivate(storedPrivateKey, 'hex');
                setKeyPair(loadedKeyPair);
                return loadedKeyPair;
            } catch (error) {
                console.error('Error loading stored key:', error);
            }
        }
        
        // Generate a new key pair
        const newKeyPair = EC.genKeyPair();
        const privateKeyHex = newKeyPair.getPrivate('hex');
        
        // Store private key in session storage
        sessionStorage.setItem(`privateKey-${name}-${room}`, privateKeyHex);
        
        setKeyPair(newKeyPair);
        return newKeyPair;
    }, [name, room]);


    // Derive a shared secret and encrypt using AES
const encryptMessage = useCallback((text, recipientPublicKey) => {
    try {
        // Parse public key if it's not already an object
        const recipientKey = typeof recipientPublicKey === 'string' 
            ? EC.keyFromPublic(recipientPublicKey, 'hex') 
            : recipientPublicKey;
        
        // Get my private key and recipient's public key
        const privateKey = keyPair.getPrivate();
        const publicPoint = recipientKey.getPublic();
        
        // Compute shared secret
        const sharedSecret = publicPoint.mul(privateKey);
        
        // Use the x-coordinate as key material, ensuring consistent format
        const sharedX = sharedSecret.getX().toString(16).padStart(64, '0');
        
        // Hash the shared secret for better security (optional but recommended)
        const derivedKeyHex = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(sharedX)).toString();
        const derivedKey = CryptoJS.enc.Hex.parse(derivedKeyHex);
        
        // Generate a random IV
        const iv = CryptoJS.lib.WordArray.random(16);
        
        // Encrypt the message with AES
        const encrypted = CryptoJS.AES.encrypt(text, derivedKey, { 
            iv: iv,
            padding: CryptoJS.pad.Pkcs7,
            mode: CryptoJS.mode.CBC
        });
        
        // Combine IV and ciphertext
        const ivString = CryptoJS.enc.Base64.stringify(iv);

        console.log("Complete encryption details:", {
            recipientPublicKeyFull: recipientPublicKey,
            myPrivateKeyHint: keyPair.getPrivate().toString(16).substring(0, 8) + '...',
            sharedSecretHint: sharedSecret.getX().toString(16).substring(0, 8) + '...',
            ivHint: iv.toString().substring(0, 10) + '...',
            ciphertextHint: encrypted.toString().substring(0, 10) + '...'
        }
        )
        
        // Return both IV and encrypted message
        return JSON.stringify({
            iv: ivString,
            ciphertext: encrypted.toString()
        });
        
    } catch (error) {
        console.error('Encryption error:', error);
        return JSON.stringify({
            error: 'Encryption failed',
            details: error.message,
            originalText: text
        });
    }
}, [keyPair]);

// Decrypt message using the shared secret
const decryptMessage = useCallback((encryptedData, senderPublicKey) => {
    try {
        // Parse the encrypted data
        const parsedData = JSON.parse(encryptedData);
        
        // If there was an encryption error, just return the original text
        if (parsedData.error) {
            console.warn('Received message with encryption error:', parsedData.details);
            return parsedData.originalText;
        }
        
        // Extract IV and ciphertext
        const iv = CryptoJS.enc.Base64.parse(parsedData.iv);
        const ciphertext = parsedData.ciphertext;
        
        // Parse sender public key if it's not already an object
        const senderKey = typeof senderPublicKey === 'string' 
            ? EC.keyFromPublic(senderPublicKey, 'hex') 
            : senderPublicKey;
        
        // Get my private key and sender's public key
        const privateKey = keyPair.getPrivate();
        const publicPoint = senderKey.getPublic();
        
        // Compute shared secret - same operation as in encrypt
        const sharedSecret = publicPoint.mul(privateKey);
        
        // Use the x-coordinate as key material, ensuring consistent format
        const sharedX = sharedSecret.getX().toString(16).padStart(64, '0');
        
        // Hash the shared secret exactly as in encryption
        const derivedKeyHex = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(sharedX)).toString();
        const derivedKey = CryptoJS.enc.Hex.parse(derivedKeyHex);
        
        // 2. Add more detailed logging in the decryptMessage function:
        // Add this right before the decryption operation:
        
        console.log("Complete decryption details:", {
            senderPublicKeyFull: senderPublicKey,
            myPrivateKeyHint: keyPair.getPrivate().toString(16).substring(0, 8) + '...',
            sharedSecretHint: sharedSecret.getX().toString(16).substring(0, 8) + '...',
            ivHint: iv.toString().substring(0, 10) + '...',
            ciphertextHint: ciphertext.substring(0, 10) + '...'
        });
        
        // Decrypt the message with the proper key format
        const decrypted = CryptoJS.AES.decrypt(
            ciphertext, 
            derivedKey, 
            {
                iv: iv,
                padding: CryptoJS.pad.Pkcs7,
                mode: CryptoJS.mode.CBC
            }
        );
        

        
        // Convert to UTF-8 string with error handling
        let result = '';
        try {
            result = decrypted.toString(CryptoJS.enc.Utf8);
            if (!result) {
                throw new Error('Decryption produced empty result');
            }
        } catch (e) {
            console.error('Error converting decrypted bytes to string:', e);
            throw new Error('Decryption failed - incompatible keys');
        }
        
        return result;
    } catch (error) {
        console.error('Decryption error:', error);
        return 'Message could not be decrypted: ' + error.message;
    }
}, [keyPair]);
    // Initialize connection and setup key exchange
    useEffect(() => {
        const { name, room } = queryString.parse(window.location.search);
        console.log('Joining with:', { name, room });
        socket = io(ENDPOINT);
        setName(name);
        setRoom(room);

        // Generate key pair
        const newKeyPair = generateKeyPair();
        
        // Get public key in hex format
        const publicKeyHex = newKeyPair.getPublic('hex');
        
        // Join room and send public key
        socket.emit('join', { 
            name, 
            room,
            publicKey: publicKeyHex 
        }, (error) => {
            if (error) {
                alert(error);
            }
        });

        return () => {
            socket.disconnect();
            socket.off();
        };
    }, [ENDPOINT, generateKeyPair]);

    // Handle incoming messages and user data
    useEffect(() => {
        // Handle receiving public keys from other users
        socket.on('publicKeys', (keys) => {
            console.log('Received public keys:', keys);
            setPublicKeys(keys);
        });
    
        socket.on('message', (message) => {
            // Handle encrypted message packages
            if (message.encrypted) {
                try {
                    // Parse the message package
                    const messagePackage = JSON.parse(message.text);
                    const sender = messagePackage.sender;
                    
                    // If there's an encryption for this user
                    if (messagePackage.recipients && messagePackage.recipients[name]) {
                        // Get the encryption for this specific recipient
                        const myEncryption = messagePackage.recipients[name];
                        // Decrypt using the sender's public key
                        const senderPublicKey = publicKeys[sender];
                        if (senderPublicKey) {
                            const decryptedText = decryptMessage(myEncryption, senderPublicKey);
                            // Add the decrypted message to the message list
                            setMessages(messages => [...messages, {
                                user: sender,
                                text: decryptedText,
                                encrypted: true,
                                decryptionFailed: false
                            }]);
                        } else {
                            // Can't decrypt without sender's public key
                            setMessages(messages => [...messages, {
                                user: sender,
                                text: "Can't decrypt: Sender's public key not available",
                                encrypted: true,
                                decryptionFailed: true
                            }]);
                        }
                    } else {
                        // Message wasn't meant for this user
                        setMessages(messages => [...messages, {
                            user: sender,
                            text: "Message not intended for you",
                            encrypted: true,
                            decryptionFailed: true
                        }]);
                    }
                } catch (error) {
                    console.error("Error processing encrypted message:", error);
                    setMessages(messages => [...messages, {
                        ...message,
                        text: "Error processing encrypted message: " + error.message,
                        encrypted: true,
                        decryptionFailed: true
                    }]);
                }
            } else {
                // Handle regular messages (like system messages)
                setMessages(messages => [...messages, message]);
            }
        });
        
        
    
        socket.on('roomData', ({ users }) => {
            console.log('Room data:', users);
            setUsers(users);
        });
    
        return () => {
            socket.off('message');
            socket.off('roomData');
            socket.off('publicKeys');
        };
    }, [keyPair, publicKeys, decryptMessage]);
    
    // Handle sending messages with encryption
    const sendMessage = (event) => {
        event.preventDefault();
    
        if (message && message.trim() !== '') {
            
            // Get all other users in the room
            const recipients = users.filter(user => user.name !== name);
            if (recipients.length > 0 && keyPair) {
                // Create a message package containing encryptions for each recipient
                const messagePackage = {
                    sender: name,
                    timestamp: new Date().toISOString(),
                    recipients: {}
                };
                
                // Encrypt the message for each recipient
                recipients.forEach(recipient => {
                    const recipientName = recipient.username;
                    const recipientPublicKey = publicKeys[recipientName];

                    if (recipientPublicKey) {
                        // Encrypt specifically for this recipient
                        messagePackage.recipients[recipientName] = encryptMessage(message, recipientPublicKey);
                    }
                });
                
                // Also encrypt a copy for yourself so you can see your own messages
                messagePackage.recipients[name] = encryptMessage(message, publicKeys[name]);
                
                // Send the package with all encrypted versions
                socket.emit('sendMessage', JSON.stringify(messagePackage), () => setMessage(''));
            } else {
                // If there are no recipients or we don't have a key pair
                socket.emit('sendMessage', message, () => setMessage(''));
            }
        }
    };

    // UI Rendering
    return (
       
    <div className="container mx-auto min-h-screen flex flex-col">
      <div className="bg-white rounded-lg shadow-lg p-4 flex-grow flex flex-col">
        {/* Info Bar */}
        <InfoBar room={room} users={users} name={name} />

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-4 flex-grow">
            {/* Users Sidebar */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-4 h-full border border-gray-200">
              <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                <Users className="mr-2 h-5 w-5 text-blue-500" /> Users in Room
              </h2>
              <ScrollArea.Root className="h-20 ">
                <ScrollArea.Viewport className="w-full h-full">
                  <ul className="space-y-1">
                  {users && users.map((user) => (
                    <div 
                      key={user.id} 
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-md"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-slate-700">
                        {user.username}
                      </span>
                    </div>
                  ))}
                  </ul>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                  className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 rounded-tr-md rounded-br-md"
                  orientation="vertical"
                >
                  <ScrollArea.Thumb className="flex-1 bg-gray-300 rounded-full relative" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>
            </div>
          </div>
          {/* Chat Area */}
          <div className="w-full lg:w-3/4 flex flex-col">
            <div className="bg-white rounded-lg shadow-md flex-grow flex flex-col border border-gray-200 overflow-hidden">
              {/* Messages Scroll Area */}
              <ScrollArea.Root className="flex-grow h-96 overflow-hidden">
                <ScrollArea.Viewport 
                  className="w-full h-full p-4 overflow-auto" 
                  ref={messagesEndRef}
                >
                  <div className="space-y-2 flex flex-col min-h-full">
                    {messages.map((message, i) => (
                      <Message 
                        key={i} 
                        message={message} 
                        name={name} 
                      />
                    ))}
                  </div>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar
                  className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 rounded-tr-md rounded-br-md"
                  orientation="vertical"
                >
                  <ScrollArea.Thumb className="flex-1 bg-gray-300 rounded-full relative" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>

              {/* Input Area */}
              <Input message={message} setMessage={setMessage} sendMessage={sendMessage} type="end2end" />
            </div>
          </div>

          
        </div>
      </div>
    </div>
    );
};

export default Chat;