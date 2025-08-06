import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatComponent = ({ userId, userName, chatType = 'general' }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize socket connection
    const apiUrl = process.env.REACT_APP_API_URL || 'https://fixloapp.onrender.com';
    const newSocket = io(apiUrl, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      
      // Join chat room based on type
      newSocket.emit('join-room', {
        userId,
        userName,
        chatType
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
    });

    newSocket.on('user-joined', (userData) => {
      setMessages(prev => [...prev, {
        type: 'system',
        content: `${userData.userName} joined the chat`,
        timestamp: new Date().toISOString()
      }]);
      setOnlineUsers(prev => [...prev, userData]);
    });

    newSocket.on('user-left', (userData) => {
      setMessages(prev => [...prev, {
        type: 'system',
        content: `${userData.userName} left the chat`,
        timestamp: new Date().toISOString()
      }]);
      setOnlineUsers(prev => prev.filter(user => user.userId !== userData.userId));
    });

    newSocket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId, userName, chatType]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !isConnected) return;

    const messageData = {
      userId,
      userName,
      content: inputMessage.trim(),
      chatType,
      timestamp: new Date().toISOString()
    };

    socket.emit('send-message', messageData);
    setInputMessage('');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">
              {chatType === 'general' ? 'General Chat' : 'Project Chat'}
            </h3>
            <p className="text-blue-100 text-sm">
              {isConnected ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  Connected
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
                  Disconnected
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">
              {onlineUsers.length} online
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`
              ${message.type === 'system' 
                ? 'text-center text-gray-500 text-sm italic' 
                : message.userId === userId 
                  ? 'flex justify-end' 
                  : 'flex justify-start'
              }
            `}>
              {message.type === 'system' ? (
                <p>{message.content}</p>
              ) : (
                <div className={`
                  max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                    message.userId === userId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }
                `}>
                  {message.userId !== userId && (
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {message.userName}
                    </p>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-75 ${
                    message.userId === userId ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isConnected ? "Type your message..." : "Connecting..."}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || !isConnected}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-600 mb-2">Online now:</p>
          <div className="flex flex-wrap gap-1">
            {onlineUsers.map((user, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
              >
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                {user.userName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatComponent;