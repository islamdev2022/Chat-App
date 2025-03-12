import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import CryptoJS from "crypto-js";
import elliptic from "elliptic";
import InfoBar from './InfoBar';
import Input from './Input';
import Messages from './Messages';
import queryString from 'query-string';

const EC = new elliptic.ec("secp256k1");
let socket = null; // Initialize socket later to avoid connection issues

const ChatPTP = () => {
    const [name, setName] = useState("");
    const [room, setRoom] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [peers, setPeers] = useState({});
    const [publicKeys, setPublicKeys] = useState({});
    const [connected, setConnected] = useState(false);
    // Track connection status of each peer
    const [peerConnectionStatus, setPeerConnectionStatus] = useState({});
    const keyPair = useRef(EC.genKeyPair());  // Generate key pair
    const peersRef = useRef({});
    const myPublicKey = useRef(keyPair.current.getPublic("hex"));
    const socketRef = useRef(null);
    const hasPeerKeysRef = useRef(false);  // Track if we have all peer public keys

    const setupSocketDebug = (socket) => {
        // Define all the socket events you want to track
        const socketEvents = [
          'connect', 
          'disconnect', 
          'connect_error',
          'join',
          'signal',
          'message',
          'roomData',
          'publicKeys'
        ];
      
        // Create debug listeners for each event
        socketEvents.forEach(event => {
          socket.on(event, (...args) => {
            console.log(`[SOCKET:${event}]`, ...args);
          });
        });
      
        // Track emit calls
        const originalEmit = socket.emit;
        socket.emit = function(event, ...args) {
          console.log(`[SOCKET EMIT:${event}]`, ...args);
          return originalEmit.apply(this, [event, ...args]);
        };
      
        return () => {
          // Cleanup function
          socketEvents.forEach(event => {
            socket.off(event);
          });
          socket.emit = originalEmit;
        };
    };

    useEffect(() => {
        // Initialize socket connection
        if (!socketRef.current) {
            socketRef.current = io("http://localhost:5000");
            socket = socketRef.current;
        }

        const cleanupDebug = setupSocketDebug(socket);
        
        // Parse URL parameters with fallbacks
        const { name, room } = queryString.parse(window.location.search);
        
        // Validate parameters exist, otherwise use defaults
        const validName = name || "Anonymous";
        const validRoom = room || "DefaultRoom";

        console.log("Joining with:", { name: validName, room: validRoom });
        
        setName(validName);
        setRoom(validRoom);

        console.log("Public key:", myPublicKey.current);
        
        // Join room and share public key
        socket.emit("join", { 
            name: validName, 
            room: validRoom, 
            publicKey: myPublicKey.current 
        }, (error) => {
            if (error) {
                console.error("Join error:", error);
                setMessages(prev => [...prev, { 
                    user: "System", 
                    text: `Error joining room: ${error}` 
                }]);
            } else {
                setConnected(true);
                console.log("Successfully joined room, requesting public keys");
                // Request public keys only after successful join
                socket.emit("requestPublicKeys", (error) => {
                    if (error) {
                        console.error("Failed to get public keys:", error);
                        setMessages(prev => [...prev, { 
                            user: "System", 
                            text: `Failed to get public keys: ${error}` 
                        }]);
                    }
                });
            }
        });

        // Setup event listeners
        socket.on("message", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on("roomData", ({ users }) => {
            console.log("Room data updated:", users);
            setUsers(users);
            
            // Check if we need to initiate connections with users already in the room
            users.forEach(user => {
                if (user.id !== socket.id && !peersRef.current[user.id]) {
                    console.log(`Initiating connection to existing user: ${user.id}`);
                    connectToPeer(user.id);
                }
            });
        });

        socket.on("publicKeys", (keys) => {
            console.log("Received public keys:", keys);
            setPublicKeys(keys);
            hasPeerKeysRef.current = true;
            
            // Log if we received all expected keys
            const userIds = users.map(user => user.id);
            const receivedKeyIds = Object.keys(keys);
            
            const missingKeys = userIds.filter(id => id !== socket.id && !receivedKeyIds.includes(id));
            if (missingKeys.length > 0) {
                console.warn("Missing public keys for users:", missingKeys);
                setMessages(prev => [...prev, { 
                    user: "System", 
                    text: `Warning: Missing public keys for some users. P2P may not work fully.` 
                }]);
            } else {
                console.log("All public keys received successfully");
                setMessages(prev => [...prev, { 
                    user: "System", 
                    text: `All public keys received. P2P communication ready.` 
                }]);
            }
        });
        
        socket.on("signal", ({ from, signal }) => {
            console.log(`Received signal from ${from}`);
            
            if (peersRef.current[from]) {
                peersRef.current[from].signal(signal);
            } else {
                connectToPeer(from, signal);
            }
        });

        socket.on("join", (peerId) => {
            console.log(`New user joined: ${peerId}`);
            if (peerId !== socket.id) {
                connectToPeer(peerId);
            }
        });

        return () => {
            cleanupDebug();
            
            // Disconnect from all peers
            Object.values(peersRef.current).forEach(peer => {
                if (peer && typeof peer.destroy === 'function') {
                    peer.destroy();
                }
            });
            
            if (socket) {
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Create a new P2P connection
    const connectToPeer = (peerId, incomingSignal = null) => {
        console.log(`Connecting to peer: ${peerId}`);
        
        if (peersRef.current[peerId]) {
            console.log(`Peer connection already exists for ${peerId}`);
            return;
        }
        
        // Update connection status
        setPeerConnectionStatus(prev => ({ 
            ...prev, 
            [peerId]: 'connecting' 
        }));
        
        const peer = new SimplePeer({
            initiator: !incomingSignal,
            trickle: true,
            config: {
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            },
            // This is critical for same-browser testing
            sdpTransform: (sdp) => {
                // Force the use of relay candidates for testing
                return sdp.replace(/a=candidate.*typ host.*\r\n/g, '');
            }
        });

        // Inside connectToPeer function
peer._pc.addEventListener('iceconnectionstatechange', () => {
    console.log(`ICE connection state for ${peerId}: ${peer._pc.iceConnectionState}`);
    if (peer._pc.iceConnectionState === 'failed') {
        console.error('ICE connection failed - likely a network/firewall issue');
    }
});

        peer.on("signal", (signal) => {
            console.log(`Sending signal to ${peerId}`);
            socket.emit("signal", { to: peerId, signal });
        });

        const connectionTimeout = setTimeout(() => {
            if (peerConnectionStatus[peerId] !== 'connected') {
                console.error(`Connection to peer ${peerId} timed out after 15 seconds`);
                setMessages(prev => [...prev, { 
                    user: "System", 
                    text: `P2P connection to peer timed out. Using server fallback.` 
                }]);
            }
        }, 15000);

        peer.on("connect", () => {

            clearTimeout(connectionTimeout);
            console.log(`Peer connection ESTABLISHED with ${peerId}`);
            setPeerConnectionStatus(prev => ({ 
                ...prev, 
                [peerId]: 'connected' 
            }));
            
            // Send a test message to confirm the connection works
            try {
                const peerPublicKey = publicKeys[peerId];
                if (peerPublicKey) {
                    const testMessage = encryptMessage("Connection test", peerPublicKey);
                    peer.send(testMessage);
                    console.log(`Sent test message to peer ${peerId}`);
                } else {
                    console.warn(`Cannot send test message: missing public key for ${peerId}`);
                }
            } catch (error) {
                console.error(`Failed to send test message to ${peerId}:`, error);
            }
            
            setMessages(prev => [...prev, { 
                user: "System", 
                text: `P2P connection established with ${peerId}` 
            }]);
        });

        peer.on("data", (data) => {
            console.log(`Received data from peer ${peerId}, length: ${data.length}`);
            handleIncomingMessage(data, peerId);
        });

        peer.on("error", (err) => {
            console.error(`Peer error with ${peerId}:`, err);
            setPeerConnectionStatus(prev => ({ 
                ...prev, 
                [peerId]: 'error' 
            }));
            
            setMessages(prev => [...prev, { 
                user: "System", 
                text: `P2P connection error with ${peerId}: ${err.message}` 
            }]);
        });

        peer.on("close", () => {
            console.log(`Peer connection closed with ${peerId}`);
            setPeerConnectionStatus(prev => ({ 
                ...prev, 
                [peerId]: 'closed' 
            }));
            
            // Remove from peersRef
            delete peersRef.current[peerId];
        });

        if (incomingSignal) {
            peer.signal(incomingSignal);
        }
        
        peersRef.current[peerId] = peer;
        setPeers((prev) => ({ ...prev, [peerId]: peer }));
    };

    // Encrypt message
    const encryptMessage = (text, recipientKey) => {
        try {
            const sharedSecret = keyPair.current.derive(
                EC.keyFromPublic(recipientKey, "hex").getPublic()
            );
            const sharedKeyHex = sharedSecret.toString(16);
            const sharedKey = CryptoJS.SHA256(sharedKeyHex).toString();

            const iv = CryptoJS.lib.WordArray.random(16);
            const encrypted = CryptoJS.AES.encrypt(text, CryptoJS.enc.Hex.parse(sharedKey), {
                iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            });

            return JSON.stringify({ 
                iv: iv.toString(CryptoJS.enc.Base64), 
                data: encrypted.toString() 
            });
        } catch (error) {
            console.error("Encryption failed:", error);
            return JSON.stringify({ error: "Encryption failed" });
        }
    };

    // Decrypt message
    const decryptMessage = (encryptedData, senderKey) => {
        try {
            const parsed = JSON.parse(encryptedData);
            if (parsed.error) return "Error: " + parsed.error;
            
            const sharedSecret = keyPair.current.derive(
                EC.keyFromPublic(senderKey, "hex").getPublic()
            );
            const sharedKeyHex = sharedSecret.toString(16);
            const sharedKey = CryptoJS.SHA256(sharedKeyHex).toString();

            const decrypted = CryptoJS.AES.decrypt(parsed.data, CryptoJS.enc.Hex.parse(sharedKey), {
                iv: CryptoJS.enc.Base64.parse(parsed.iv),
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            });

            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error("Decryption failed:", error);
            return "ERROR: Unable to decrypt message";
        }
    };

    // Handle receiving messages
    const handleIncomingMessage = (data, peerId) => {
        console.log(`Processing message from ${peerId}, data type: ${typeof data}`);
        if (!publicKeys[peerId]) {
            console.error(`Public key for peer ${peerId} not found`);
            setMessages(prev => [...prev, { user: peerId, text: "ERROR: Cannot decrypt (missing public key)" }]);
            return;
        }
        
        try {
            const dataString = typeof data === 'string' ? data : data.toString();
            console.log(`Message data (truncated): ${dataString.substring(0, 30)}...`);
            
            const decryptedText = decryptMessage(dataString, publicKeys[peerId]);
            console.log(`Decrypted message from ${peerId}: ${decryptedText}`);
            
            // Skip displaying test messages
            if (decryptedText === "Connection test") {
                console.log("Skipping display of test message");
                return;
            }
            
            setMessages(prev => [...prev, { user: peerId, text: decryptedText }]);
        } catch (error) {
            console.error("Error handling incoming message:", error);
            setMessages(prev => [...prev, { user: peerId, text: "ERROR: Message processing failed" }]);
        }
    };

    // Get count of fully connected peers
    const getConnectedPeerCount = () => {
        return Object.values(peerConnectionStatus).filter(status => status === 'connected').length;
    };

    // Send message P2P to all peers
    const sendMessage = (event) => {
        event?.preventDefault();
        if (!message) return;
        
        // Debug connection state
        console.log("Current peer connection status:", peerConnectionStatus);
        console.log("Current public keys:", publicKeys);
        
        // Check if we have peers to send to
        const peerIds = Object.keys(peersRef.current);
        const connectedPeerIds = peerIds.filter(id => peerConnectionStatus[id] === 'connected');
        
        console.log("All peers:", peerIds);
        console.log("Connected peers:", connectedPeerIds);
        
        if (connectedPeerIds.length === 0) {
            console.log("No connected peers available, falling back to server");
            // If no direct peers, send through server with encryption
            const messagePackage = {
                text: message,
                recipients: publicKeys
            };
            
            socket.emit("sendMessage", messagePackage, (error) => {
                if (error) {
                    console.error("Failed to send message:", error);
                    setMessages(prev => [...prev, { 
                        user: "System",
                        text: `Failed to send message: ${error}`
                    }]);
                }
            });
            
            // Add your own message to the list
            setMessages(prev => [...prev, { 
                user: name, 
                text: message,
                sentVia: "server"  // Track how this was sent
            }]);
            
            setMessage("");
            return;
        }
        
        let sentToAnyone = false;
        
        // Send to each connected peer
        connectedPeerIds.forEach((peerId) => {
            const peerPublicKey = publicKeys[peerId];
            if (!peerPublicKey) {
                console.error(`Missing public key for peer ${peerId}`);
                return;
            }
            
            try {
                const encrypted = encryptMessage(message, peerPublicKey);
                console.log(`Sending encrypted message to ${peerId}, length: ${encrypted.length}`);
                peersRef.current[peerId].send(encrypted);
                sentToAnyone = true;
            } catch (error) {
                console.error(`Failed to send to peer ${peerId}:`, error);
            }
        });
        
        if (sentToAnyone) {
            // Add your own message to the list
            setMessages(prev => [...prev, { 
                user: name, 
                text: message,
                sentVia: "p2p"  // Track how this was sent
            }]);
        } else {
            setMessages(prev => [...prev, { 
                user: "System",
                text: "Failed to send message to any peers"
            }]);
        }
        
        setMessage("");
    };

    // Display current connection status for debugging
    const renderConnectionStatus = () => {
        const connectedCount = getConnectedPeerCount();
        const totalPeers = Object.keys(peersRef.current).length;
        
        return (
            <div className="px-4 py-2 bg-slate-100 text-xs text-slate-600">
                <div>Connection Status: {connected ? 'Connected to server' : 'Disconnected'}</div>
                <div>P2P Connections: {connectedCount}/{totalPeers} peers connected</div>
                <div>Public Keys Received: {Object.keys(publicKeys).length}</div>
                <div className="text-xs text-slate-500">
                    {Object.entries(peerConnectionStatus).map(([peerId, status]) => (
                        <div key={peerId}>
                            Peer {peerId.substring(0, 8)}...: {status}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex w-full justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 sm:p-4">
            <div className="w-full max-w-md sm:max-w-lg md:max-w-xl h-[98vh] sm:h-[90vh] flex flex-col sm:rounded-xl shadow-lg overflow-hidden bg-white border border-slate-200">
                <InfoBar room={room} name={name} users={users} />
                {renderConnectionStatus()}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    <Messages 
                        messages={messages} 
                        name={name} 
                        // Add indicator for how messages were sent
                        enhancedDisplay={true}
                    />
                    <Input 
                        message={message} 
                        setMessage={setMessage} 
                        sendMessage={sendMessage} 
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatPTP;