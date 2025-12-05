import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

export const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    console.log('Initializing socket connection with URL:', backendUrl);
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Attempting to reconnect... (Attempt ${attemptNumber})`);
    });

    newSocket.on('reconnect_error', (err) => {
      console.error('❌ Reconnection error:', err.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed. Please check the server status and network connection.');
    });

    newSocket.on('user-info', (userInfo) => {
      console.log('ℹ️ Received user info:', userInfo);
      setUser(userInfo);
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnected(false);
    });

    newSocket.on('message-received', (message) => {
      console.log('📨 New message:', message);
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('recent-messages', (recentMessages) => {
      console.log('📚 Loaded recent messages:', recentMessages.length);
      setMessages(recentMessages);
    });

    newSocket.on('online-users', (users) => {
      console.log('👥 Online users:', users.length);
      setOnlineUsers(users);
    });

    newSocket.on('user-joined', (user) => {
      console.log('👋 User joined:', user.username);
      setOnlineUsers(prev => [...prev, user]);
    });

    newSocket.on('user-left', ({ id }) => {
      console.log('👋 User left');
      setOnlineUsers(prev => prev.filter(user => user.id !== id));
    });

    newSocket.on('reaction-updated', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, reactions } : msg
      ));
    });

    newSocket.on('user-typing', (user) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.username === user.username)) {
          return [...prev, user];
        }
        return prev;
      });
    });

    newSocket.on('user-stop-typing', ({ username }) => {
      setTypingUsers(prev => prev.filter(user => user.username !== username));
    });

    return () => {
      console.log('Closing socket connection');
      newSocket.close();
    };
  }, []);

  const joinChat = (userData) => {
    console.log('🚀 Joining chat with:', userData);
    if (socket && connected) {
      socket.emit('join-chat', userData);
      // user will be set when 'user-info' is received from backend
    }
  };

  const sendMessage = (messageData) => {
    console.log('📤 Sending message:', messageData);
    if (socket && connected) {
      socket.emit('new-message', messageData);
    }
  };

  const toggleReaction = (messageId, emoji) => {
    if (socket && connected) {
      console.log('[toggleReaction] Emitting toggle-reaction:', { messageId, emoji });
      socket.emit('toggle-reaction', { messageId, emoji });
    } else {
      console.warn('[toggleReaction] Socket not connected, cannot emit reaction.');
    }
  };

  const startTyping = () => {
    if (socket && connected) {
      socket.emit('typing-start');
    }
  };

  const stopTyping = () => {
    if (socket && connected) {
      socket.emit('typing-stop');
    }
  };

  const value = {
    socket,
    connected,
    messages,
    onlineUsers,
    typingUsers,
    user,
    joinChat,
    sendMessage,
    toggleReaction,
    startTyping,
    stopTyping
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};