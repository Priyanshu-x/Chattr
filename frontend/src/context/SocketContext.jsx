import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

export const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [user, setUser] = useState(null);

  // Initialize socket connection once
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '/';
    console.log('SocketContext: Initializing socket connection with URL:', backendUrl);
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return () => {
      console.log('SocketContext: Cleanup during component unmount - disconnecting socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Set up all event listeners and handle cleanup for them
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log('SocketContext: Setting up socket event listeners.');

    socket.on('connect', () => {
      console.log('SocketContext: ✅ Connected to server');
      setConnected(true);
    });

    socket.on('connecting', () => {
      console.log('SocketContext: Attempting to connect to server...');
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Attempting to reconnect... (Attempt ${attemptNumber})`);
    });

    socket.on('reconnect_error', (err) => {
      console.error('❌ Reconnection error:', err.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed. Please check the server status and network connection.');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnected(false);
    });

    socket.on('user-info', (userInfo) => {
      console.log('ℹ️ Received user info:', userInfo);
      setUser(userInfo);
    });

    socket.on('message-received', (message) => {
      console.log('📨 New message:', message);
      setMessages(prev => [...prev, message]);
    });

    socket.on('recent-messages', (recentMessages) => {
      console.log('📚 Loaded recent messages:', recentMessages.length);
      setMessages(recentMessages);
    });

    socket.on('online-users', (users) => {
      console.log('👥 Online users:', users.length);
      setOnlineUsers(users);
    });

    socket.on('user-joined', (user) => {
      console.log('👋 User joined:', user.username);
      setOnlineUsers(prev => [...prev, user]);
    });

    socket.on('user-left', ({ id }) => {
      console.log('👋 User left');
      setOnlineUsers(prev => prev.filter(user => user.id !== id));
    });

    socket.on('reaction-updated', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, reactions } : msg
      ));
    });

    socket.on('user-typing', (user) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.username === user.username)) {
          return [...prev, user];
        }
        return prev;
      });
    });

    socket.on('user-stop-typing', ({ username }) => {
      setTypingUsers(prev => prev.filter(user => user.username !== username));
    });

    return () => {
      console.log('SocketContext: Cleaning up socket event listeners.');
      // Remove all listeners to prevent memory leaks
      socket.off('connect');
      socket.off('connecting');
      socket.off('connect_error');
      socket.off('reconnect_attempt');
      socket.off('reconnect_error');
      socket.off('reconnect_failed');
      socket.off('disconnect');
      socket.off('user-info');
      socket.off('message-received');
      socket.off('recent-messages');
      socket.off('online-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('reaction-updated');
      socket.off('user-typing');
      socket.off('user-stop-typing');
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const joinChat = (userData) => {
    console.log('🚀 Joining chat with:', userData);
    if (socketRef.current && connected) {
      socketRef.current.emit('join-chat', userData);
      // user will be set when 'user-info' is received from backend
    }
  };

  const sendMessage = (messageData) => {
    console.log('📤 Sending message:', messageData);
    if (socketRef.current && connected) {
      socketRef.current.emit('new-message', messageData);
    }
  };

  const toggleReaction = (messageId, emoji) => {
    if (socketRef.current && connected) {
      console.log('[toggleReaction] Emitting toggle-reaction:', { messageId, emoji });
      socketRef.current.emit('toggle-reaction', { messageId, emoji });
    } else {
      console.warn('[toggleReaction] Socket not connected, cannot emit reaction.');
    }
  };

  const startTyping = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing-start');
    }
  };

  const stopTyping = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('typing-stop');
    }
  };

  const value = {
    socket: socketRef.current,
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