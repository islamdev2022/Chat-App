import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { io } from "socket.io-client";
import ScrollToBottom from "react-scroll-to-bottom"
import { Users, LogIn,Undo2,LogOut,Send,X } from "lucide-react";
import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import Input from "./Input";
import JoinRoomPTP from "./JoinPTP";
const ChatPTP = () => {
  // States for user info and room
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // States for chat
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Refs for socket and peer connections
  const socketRef = useRef();
  const peerRef = useRef();
  const peerConnections = useRef({});
  const localId = useRef("");
  const ENDPOINT = import.meta.env.VITE_SERVER_URL

  // Handle room joining
  const joinRoom = async () => {
    if (!username || !room) {
      setError("Username and room name are required!");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Initialize peer
      peerRef.current = new Peer();
      
      peerRef.current.on("open", (id) => {
        localId.current = id;
        console.log("PeerJS ID:", id);
        
        // Connect to socket server
        socketRef.current = io(ENDPOINT);
        
        // Handle socket connection
        socketRef.current.on("connect", () => {
          console.log("Connected to signaling server");
          
          // Join room
          socketRef.current.emit("join", {
            name: username,
            room: room,
            publicKey: id // Using Peer ID as public key
          }, (error) => {
            if (error) {
              setError(error);
              setLoading(false);
              return;
            }
            
            setJoined(true);
            setLoading(false);
          });
        });
        
        // Socket event handlers
        setupSocketEventHandlers();
      });
      
      // Handle peer errors
      peerRef.current.on("error", (err) => {
        console.error("Peer error:", err);
        setError(`Peer connection error: ${err.message}`);
      });
      
      // Setup peer event handlers
      setupPeerEventHandlers();
      
    } catch (err) {
      console.error("Join error:", err);
      setError(`Error joining room: ${err.message}`);
      setLoading(false);
    }
  };
  
  const setupSocketEventHandlers = () => {
    if (!socketRef.current) return;
    
    // Handle incoming messages from socket
    socketRef.current.on("message", (message) => {
      console.log("Received message:", message);
      
      // Handle regular messages
      if (!message.encrypted) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            id: prevMessages.length + 1,
            user: message.user,
            text: message.text,
            isAdmin: message.user === "admin" || message.user === "Admin"
          }
        ]);
      } else {
        // For demo purposes - in a real app you'd decrypt these
        console.log("Received encrypted message, handling via direct P2P connection");
      }
    });
    
    // Handle room data updates
    socketRef.current.on("roomData", ({ room, users: roomUsers }) => {
      console.log("Room data updated:", { room, users: roomUsers });
      setUsers(roomUsers);
      
      // Connect to all peers in the room
      roomUsers.forEach((user) => {
        if (user.id !== socketRef.current.id && user.publicKey) {
          connectToPeer(user.publicKey, user.username);
        }
      });
    });
    
    // Handle public keys (peer IDs)
    socketRef.current.on("publicKeys", (publicKeys) => {
      console.log("Received public keys:", publicKeys);
      
      // Connect to peers using their public keys (which are peer IDs)
      Object.entries(publicKeys).forEach(([username, peerId]) => {
        if (peerId !== localId.current) {
          connectToPeer(peerId, username);
        }
      });
    });
    
    // Handle signals for WebRTC
    socketRef.current.on("signal", ({ to, signal }) => {
      console.log("Received signal from:", to);
      // Handle signaling if needed
    });
  };
  
  const setupPeerEventHandlers = () => {
    if (!peerRef.current) return;
    
    // Handle incoming connections
    peerRef.current.on("connection", (connection) => {
      const peerId = connection.peer;
      console.log("Incoming connection from peer:", peerId);
      
      // Store the connection
      peerConnections.current[peerId] = connection;
      
      // Handle data
      connection.on("data", (data) => {
        console.log("Received P2P data:", data);
        // Process the incoming message
        try {
          const msgData = typeof data === "string" ? JSON.parse(data) : data;
          
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              user: msgData.sender || "Unknown",
              text: msgData.text || data,
              isP2P: true
            }
          ]);
        } catch (err) {
          console.error("Error processing message:", err);
          // Fallback for simple string messages
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              user: "Unknown",
              text: String(data),
              isP2P: true
            }
          ]);
        }
      });
      
      // Handle connection close
      connection.on("close", () => {
        console.log("Connection closed with peer:", peerId);
        delete peerConnections.current[peerId];
      });
      
      // Handle errors
      connection.on("error", (err) => {
        console.error("Connection error with peer:", peerId, err);
      });
    });
  };
  
  const connectToPeer = (peerId, peerUsername) => {
    // Skip if already connected or trying to connect to self
    if (
      peerConnections.current[peerId] || 
      peerId === localId.current || 
      !peerRef.current
    ) {
      return;
    }
    
    console.log(`Connecting to peer: ${peerUsername} (${peerId})`);
    
    try {
      // Create a connection to the peer
      const connection = peerRef.current.connect(peerId, {
        reliable: true
      });
      
      // Store the connection with metadata
      connection.metadata = { username: peerUsername };
      
      connection.on("open", () => {
        console.log(`Connection established with: ${peerUsername}`);
        peerConnections.current[peerId] = connection;
        
        // Send a greeting
        connection.send(JSON.stringify({
          sender: username,
          text: `Hello from ${username}! Direct P2P connection established.`,
          timestamp: new Date().toISOString()
        }));
      });
      
      // Setup data handling
      connection.on("data", (data) => {
        console.log("Received P2P data:", data);
        // Process the incoming message
        try {
          const msgData = typeof data === "string" ? JSON.parse(data) : data;
          
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              user: msgData.sender || peerUsername || "Unknown",
              text: msgData.text || data,
              isP2P: true
            }
          ]);
        } catch (err) {
          // Fallback for simple string messages
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              user: peerUsername || "Unknown",
              text: String(data),
              isP2P: true
            }
          ]);
        }
      });
      
      connection.on("error", (err) => {
        console.error(`Connection error with ${peerUsername}:`, err);
      });
      
      connection.on("close", () => {
        console.log(`Connection closed with ${peerUsername}`);
        delete peerConnections.current[peerId];
      });
      
    } catch (err) {
      console.error(`Failed to connect to peer ${peerUsername}:`, err);
    }
  };
  
  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current || !joined) return;
    
    const messageObj = {
      sender: username,
      text: inputMessage,
      timestamp: new Date().toISOString()
    };
    
    // Add to local messages
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        id: prevMessages.length + 1,
        user: username,
        text: inputMessage,
        isLocal: true
      }
    ]);
    
    // Send via socket to all users (could be used for backup/logging)
    // socketRef.current.emit("sendMessage", JSON.stringify(messageObj.text), (error) => {
    //   if (error) {
    //     console.error("Error sending message via socket:", error);
    //   }
    // });
    
    // Send directly to all peer connections for true P2P
    Object.values(peerConnections.current).forEach((connection) => {
      if (connection.open) {
        connection.send(JSON.stringify(messageObj));
      }
    });
    
    setInputMessage("");
  };
  
  const leaveRoom = () => {
    // Close all peer connections
    Object.values(peerConnections.current).forEach((connection) => {
      if (connection.open) {
        connection.close();
      }
    });
    peerConnections.current = {};
    
    // Destroy the peer
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Reset state
    setJoined(false);
    setMessages([]);
    setUsers([]);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);
  
  // Fetch available rooms when component mounts
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`${ENDPOINT}/rooms`);
        const roomsData = await response.json();
        setRooms(roomsData);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };
    
    fetchRooms();
  }, []);

  const messagesEndRef = useRef(null)
  const scrollViewportRef = useRef(null)

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current && scrollViewportRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  if (!joined) {
    return (
        <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-gray-100 to-gray-200" >
            <div className="bg-white shadow-2xl rounded-2xl px-8 pt-6 pb-8 mb-4 w-full max-w-md">
            <Link to="/">
            <Undo2 className="relative text-indigo-800"/>
          </Link>
         <h2 className="text-3xl font-bold text-center mb-6 text-indigo-800"> Join a Chat Peer to Peer</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Rooms</label>
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
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
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
  }
  
  return (
    <div className="container mx-auto min-h-screen flex flex-col">
  <div className="bg-white rounded-lg shadow-lg p-4 flex-grow flex flex-col">
    {/* Room Header */}
    <div className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
      <h1 className="text-xl sm:text-3xl font-bold text-white text-center sm:text-left w-full sm:w-auto">
        Room: {room}
      </h1>
      {/* Connection Status */}
      <div className=" p-2 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
          <p>
            Connected peers: {Object.keys(peerConnections.current).length}/{users.length > 0 ? users.length - 1 : 0}
          </p>
        </div>
      <button
        onClick={leaveRoom}
        className="text-white/80 hover:text-white hover:bg-red-600 transition-colors p-1 rounded-full"
      >
         <X size={20} />
      </button>
    </div>
    
    {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-4 flex-grow">{/* Users Sidebar */}
    <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-4 h-full border border-gray-200">
              <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                <Users className="mr-2 h-5 w-5 text-blue-500" /> Users in Room
              </h2>
              <ScrollArea.Root className="h-20">
                <ScrollArea.Viewport className="w-full h-full">
                  <ul className="space-y-1">
                    {users.length === 0 ? (
                      <li className="text-gray-500">No users found</li>
                    ) : (
                      users.map((user, index) => (
                        <li
                          key={index}
                          className="p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span
                            className={`${user.id === socketRef.current?.id ? "font-medium" : ""} `}
                          >
                            {user.username}
                            {user.id === socketRef.current?.id && " (You)"}
                          </span>
                        </li>
                      ))
                    )}
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
                  ref={scrollViewportRef}
                >
                  <div className="space-y-4 flex flex-col min-h-full">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 my-8">No messages yet. Start the conversation!</div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg max-w-[85%] ${
                            msg.isLocal
                              ? "ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm"
                              : msg.isAdmin
                                ? "mx-auto bg-gray-100 text-gray-800 text-center max-w-[95%]"
                                : msg.isP2P
                                  ? "bg-blue-100 text-gray-800 shadow-sm w-fit rounded-tl-sm "
                                  : "bg-gray-100 text-gray-800 shadow-sm"
                          }`}
                          style={{
                            animation: "fadeIn 0.3s ease-out",
                            wordBreak: "break-word",
                          }}
                        >
                          {!msg.isLocal && !msg.isAdmin && (
                            <div className="font-bold text-sm mb-1">
                              {msg.user}
                              {msg.isP2P && (
                                <span className="ml-2 text-xs font-normal text-green-600">
                                  (P2P)
                                </span>
                              )}
                            </div>
                          )}
                          <div className="break-words">{msg.text}</div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
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
              <Input message={inputMessage} setMessage={setInputMessage} sendMessage={sendMessage} type="p2p" />

            </div>
          </div>

          
        </div>

        
      </div>
    </div>
  );
};

export default ChatPTP;