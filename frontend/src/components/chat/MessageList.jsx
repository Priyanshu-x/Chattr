// frontend/src/components/chat/MessageList.jsx - WORKING VERSION
import React, { useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';

const MessageList = ({ onReply }) => {
  const { messages, typingUsers, user } = useSocket();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Welcome to Anonymous Chat!
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Start a conversation by sending your first message
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => {
            if (!message.user) return null; // Skip messages with missing user
            const isOwnMessage = user && message.user._id === user.id;
            const showAvatar = index === 0 || (messages[index - 1].user && messages[index - 1].user._id !== message.user._id);
            return (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={isOwnMessage}
                showAvatar={showAvatar}
                onReply={onReply}
              />
            );
          })}

          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center space-x-3 px-2">
              <div className="flex -space-x-2">
                {typingUsers.slice(0, 3).map((user, index) => (
                  <img
                    key={index}
                    src={user.avatar}
                    alt={user.username}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                  />
                ))}
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {typingUsers.length === 1
                  ? `${typingUsers[0].username} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

