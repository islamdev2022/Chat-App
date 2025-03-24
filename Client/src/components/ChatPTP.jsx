import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { io } from "socket.io-client";
import ScrollToBottom from "react-scroll-to-bottom"

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
        socketRef.current = io("http://localhost:5000");
        
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
    socketRef.current.emit("sendMessage", JSON.stringify(messageObj), (error) => {
      if (error) {
        console.error("Error sending message via socket:", error);
      }
    });
    
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
        const response = await fetch("http://localhost:5000/rooms");
        const roomsData = await response.json();
        setRooms(roomsData);
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    };
    
    fetchRooms();
  }, []);
  
  if (!joined) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-6">Join Chat Room</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {rooms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Rooms</label>
              <div className="flex flex-wrap gap-2">
                {rooms.map(([roomName, roomInfo], index) => (
                  <button
                    key={index}
                    onClick={() => setRoom(roomName)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                  >
                    {roomName} ({roomInfo.userCount})
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
          )}
          
          <button
            onClick={joinRoom}
            disabled={loading}
            className={`w-full px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Joining..." : "Join Room"}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          Room: {room}
        </h1>
        <button
          onClick={leaveRoom}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Leave Room
        </button>
      </div>
      
      <div className="flex flex-wrap md:flex-nowrap gap-4">
        {/* Chat area */}
        <div className="w-full md:w-3/4">
          <div className="bg-white rounded-lg shadow-md h-[500px] flex flex-col">
            {/* Messages */}
            <ScrollArea.Root className="flex-grow p-4">
              <ScrollArea.Viewport className="w-full h-96">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 my-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg) => (
                              <ScrollToBottom className="h-full py-1 pl-4 custom-scrollbar shadow-xl">
                        
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg max-w-[80%] ${
                          msg.isLocal
                            ? "ml-auto bg-blue-500 text-white"
                            : msg.isAdmin
                              ? "mx-auto bg-gray-200 text-gray-800 text-center"
                              : msg.isP2P
                                ? "bg-green-100 text-gray-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
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
                        <div>{msg.text}</div>
                      </div>
                        </ScrollToBottom>
                    ))
                  )}
                </div>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar
                className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200 rounded-tr-md rounded-br-md"
                orientation="vertical"
              >
                <ScrollArea.Thumb className="flex-1 bg-gray-300 rounded-full relative" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
            
            {/* Input area */}
            <div className="p-3 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className={`px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !inputMessage.trim() ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Users sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-4 h-[500px]">
            <h2 className="text-lg font-semibold mb-3">Users in Room</h2>
            <ScrollArea.Root className="h-[450px]">
              <ScrollArea.Viewport className="w-full h-full">
                <ul className="space-y-2">
                  {users.length === 0 ? (
                    <li className="text-gray-500">No users found</li>
                  ) : (
                    users.map((user, index) => (
                      <li
                        key={index}
                        className="p-2 rounded-md hover:bg-gray-100 flex items-center"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span>
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
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md">
        <h3 className="font-semibold">Connection Status</h3>
        <p>
          Connected peers: {Object.keys(peerConnections.current).length}/
          {users.length > 0 ? users.length - 1 : 0}
        </p>
      </div>
    </div>
  );
};

export default ChatPTP;