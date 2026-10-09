import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { useSnow } from '../../context/SnowContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserJoin from '../ui/UserJoin';
import { Users, Sun, Moon, Settings, X, CloudSnow, Bell, BellOff, Pin } from 'lucide-react';

const ChatRoom = () => {
  const {
    user,
    connected,
    onlineUsers,
    notificationPermission,
    requestNotificationPermission,
    messages
  } = useSocket();
  const { isDark, toggleTheme } = useTheme();
  const { isSnowing, toggleSnow } = useSnow();

  const [showUserJoin, setShowUserJoin] = useState(!user);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    if (user) {
      setShowUserJoin(false);
    }
  }, [user]);

  if (!connected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Connecting to chat server...</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Attempting to establish a secure connection. Please check your network connectivity if this takes too long.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh">
      {/* User Join Modal */}
      {showUserJoin && (
        <UserJoin onClose={() => setShowUserJoin(false)} />
      )}

      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10 relative">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Chattr
          </h1>
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">{onlineUsers.length} online</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Snow Toggle */}
          <button
            onClick={toggleSnow}
            className={`p-2 rounded-lg transition-colors ${isSnowing
              ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            title={isSnowing ? "Stop Snowing" : "Let it Snow"}
          >
            <CloudSnow className={`h-5 w-5 ${isSnowing ? 'animate-pulse' : ''}`} />
          </button>

          {/* Notification Toggle */}
          <button
            onClick={requestNotificationPermission}
            className={`p-2 rounded-lg transition-colors ${notificationPermission === 'granted'
              ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
              : notificationPermission === 'denied'
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            title={notificationPermission === 'granted' ? "Notifications Enabled" : "Enable Notifications"}
          >
            {notificationPermission === 'granted' ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </button>

          {/* Pinned Messages Toggle */}
          <button
            onClick={() => {
              setShowPinned(!showPinned);
              setShowSidebar(false);
            }}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
            title="Pinned Messages"
          >
            <Pin className="h-5 w-5" />
            {messages.filter(m => m.isPinned).length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            )}
          </button>

          <button
            onClick={() => {
              setShowSidebar(!showSidebar);
              setShowPinned(false);
            }}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Users className="h-5 w-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {user && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 rounded-full">
              <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full" />
              <span className="text-sm font-medium">{user.username}</span>
            </div>
          )}
        </div>
      </header>

      {/* Online Users Sidebar */}
      {showSidebar && (
        <div className={`fixed inset-y-0 right-0 w-64 sm:w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-l border-gray-200 dark:border-gray-700 shadow-lg z-50 flex flex-col transform ${showSidebar ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Online Users ({onlineUsers.length})</h3>
            <button
              onClick={() => setShowSidebar(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {onlineUsers.map((user, index) => (
              <div key={user.id || index} className="flex items-center space-x-3">
                <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Online now</p>
                </div>
              </div>
            ))}
            {onlineUsers.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No users online</p>
            )}
          </div>
        </div>
      )}

      {/* Pinned Messages Sidebar */}
      {showPinned && (
        <div className={`fixed inset-y-0 right-0 w-64 sm:w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-l border-gray-200 dark:border-gray-700 shadow-lg z-50 flex flex-col transform ${showPinned ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Pin className="h-4 w-4 text-yellow-500" />
              <span>Pinned Messages</span>
            </h3>
            <button
              onClick={() => setShowPinned(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {messages.filter(m => m.isPinned).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400 space-y-2">
                <Pin className="h-8 w-8 opacity-20" />
                <p className="text-sm">No pinned messages yet.</p>
              </div>
            ) : (
              messages.filter(m => m.isPinned).map(msg => (
                <div key={msg._id} className="group relative bg-gray-50/80 dark:bg-gray-700/30 backdrop-blur-sm p-3.5 rounded-xl border border-gray-200/50 dark:border-gray-600/50 shadow-sm cursor-pointer hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:border-yellow-400/40 dark:hover:border-yellow-500/40 transition-all duration-300 overflow-hidden" onClick={() => {
                  const el = document.getElementById(`message-${msg._id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Highlight effect - target the actual chat bubble, not the whole row
                    const bubble = el.querySelector('.chat-bubble-user, .chat-bubble-other');
                    if (bubble) {
                      bubble.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-60', 'scale-[1.02]', 'transition-all', 'duration-300');
                      setTimeout(() => bubble.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-60', 'scale-[1.02]'), 1500);
                    }
                    if (window.innerWidth < 1024) setShowPinned(false); // Close on mobile
                  }
                }}>
                  {/* Subtle left gradient accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-yellow-500 opacity-40 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex items-center space-x-2 mb-2 pl-1">
                    <img src={msg.user.avatar} alt={msg.user.username} className="w-5 h-5 rounded-full ring-1 ring-gray-200 dark:ring-gray-600" />
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{msg.user.username}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-words line-clamp-3 pl-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.type === 'text' ? msg.content : `<span className="italic opacity-80">[${msg.type.toUpperCase()}]</span>` }} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MessageList onReply={setReplyingTo} />
        <MessageInput replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
      </div>

      {/* Click outside to close sidebar */}
      {(showSidebar || showPinned) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => {
            setShowSidebar(false);
            setShowPinned(false);
          }}
        ></div>
      )}
    </div>
  );
};

export default ChatRoom;