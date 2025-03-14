# Secure Chat Application

A real-time chat application with both client-server and peer-to-peer communication, featuring end-to-end encryption using Elliptic Curve Cryptography (ECC).

## Features

### Two Communication Modes
- **Client-server chat** through Socket.io
- **Peer-to-peer direct communication**

### End-to-End Encryption
- **ECC (Elliptic Curve Cryptography)** for key exchange
- **AES** for message encryption
- Secure key derivation

### Room Management
- Create or join existing chat rooms
- See available rooms
- View active users in rooms

### Responsive UI
- Works on desktop and mobile devices
- Modern, intuitive interface

## Technology Stack

### Frontend
- React
- TailwindCSS
- Socket.io-client
- SimplePeer (WebRTC)
- CryptoJS & elliptic (Encryption)

### Backend
- Node.js
- Express
- Socket.io
- Vercel (Deployment)

## Architecture

### Client-Server Mode
Messages flow through the server but are encrypted end-to-end. The server cannot read message content as it only has access to encrypted data.

### Peer-to-Peer Mode
The Socket.io server is only used for signaling (initial connection and public key exchange). After the connection is established, messages flow directly between peers via WebRTC without passing through the server.

## Security Model

1. **Key Generation**: Each user generates an ECC key pair (public/private) when joining a chat.
2. **Key Exchange**: Public keys are shared via the server while private keys never leave the client.
3. **Shared Secret**: For each conversation, a shared secret is derived from the user's private key and the recipient's public key.
4. **Message Encryption**: Messages are encrypted with AES using the derived shared secret.
5. **P2P Enhancement**: In P2P mode, data flows directly between peers, adding another layer of security by eliminating the server as a potential interception point.

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation
1. Clone the repository.
2. Install dependencies.
3. Start the development servers.

### Usage
1. **Choose Chat Mode**: Select between regular chat or peer-to-peer mode.
2. **Enter a Username**: Provide a username for identification.
3. **Join or Create a Room**: Select an existing room or create a new one.
4. **Start Chatting**: Send encrypted messages to everyone in the room.

## Limitations

- P2P connections may not work behind certain NATs or corporate firewalls.
- The server stores room information in memory, so data is lost on server restart (consider using a database for persistent storage).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
