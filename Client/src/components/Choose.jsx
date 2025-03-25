import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Lock, Globe } from 'lucide-react';

const Choose = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Choose Your Chat Experience
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Encrypted Group Chat Option */}
          <Link 
            to="/chat" 
            className="block transform transition-all duration-300 hover:scale-105"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl p-6 text-center hover:shadow-xl transition-all duration-300">
              <Lock className="mx-auto mb-4 w-16 h-16 text-white" strokeWidth={1.5} />
              <h2 className="text-2xl font-semibold mb-4">
                Encrypted Group Chat
              </h2>
              <p className="text-white/80 mb-6">
                Secure end-to-end encrypted communication for privacy-conscious users.
              </p>
              <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                <MessageCircle className="w-5 h-5" />
                <span>Start Secure Chat</span>
              </div>
            </div>
          </Link>

          {/* Peer-to-Peer Chat Option */}
          <Link 
            to="/chatp2p" 
            className="block transform transition-all duration-300 hover:scale-105"
          >
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl shadow-2xl p-6 text-center hover:shadow-xl transition-all duration-300">
              <Globe className="mx-auto mb-4 w-16 h-16 text-white" strokeWidth={1.5} />
              <h2 className="text-2xl font-semibold mb-4">
                P2P Group Chat
              </h2>
              <p className="text-white/80 mb-6">
                Direct peer-to-peer communication without intermediary servers.
              </p>
              <div className="inline-flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-full">
                <MessageCircle className="w-5 h-5" />
                <span>Start P2P Chat</span>
              </div>
            </div>
          </Link>
        </div>
        <p className="text-center text-gray-600 mt-8 text-sm">
          Choose your preferred communication method
        </p>
        <p className="text-center text-gray-600 text-xs ">&copy;2025. All rights reserved.</p>

      </div>
    </div>
  );
};

export default Choose;