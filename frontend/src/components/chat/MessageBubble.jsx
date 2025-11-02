// frontend/src/components/chat/MessageBubble.jsx - WORKING VERSION
import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { formatTime } from '../../utils/helpers';
import { Pin, MoreVertical, Copy } from 'lucide-react';

const MessageBubble = ({ message, isOwnMessage, showAvatar }) => {
  const { toggleReaction } = useSocket();
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleReaction = (emoji) => {
    toggleReaction(message._id, emoji);
    setShowReactions(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
    alert('Message copied to clipboard!');
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <p className="text-sm break-words whitespace-pre-wrap">
            {message.content}
          </p>
        );
      case 'image':
        return (
          <div className="relative">
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}${message.fileUrl}`}
              alt="Shared image"
              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(`${import.meta.env.VITE_BACKEND_URL}${message.fileUrl}`, '_blank')}
            />
            {message.content && (
              <p className="text-sm mt-2 break-words whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
        );
      case 'voice':
        return (
          <div className="flex items-center space-x-3 py-2">
            <button className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center">
              ▶️
            </button>
            <div className="flex-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">Voice message</div>
              <audio controls className="mt-1">
                <source src={`${import.meta.env.VITE_BACKEND_URL}${message.fileUrl}`} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );
      case 'file':
        const fileExtension = message.fileName ? message.fileName.split('.').pop().toLowerCase() : '';
        const isVideo = ['mp4', 'webm', 'ogg'].includes(fileExtension);
        const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension);

        if (isVideo) {
          return (
            <div className="relative">
              <video
                src={`${import.meta.env.VITE_BACKEND_URL}${message.fileUrl}`}
                controls
                className="max-w-full h-auto rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
              {message.content && (
                <p className="text-sm mt-2 break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
            </div>
          );
        } else if (isImage) {
          return (
            <div className="relative">
              <img
                src={`${import.meta.env.VITE_BACKEND_URL}${message.fileUrl}`}
                alt="Shared image"
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(`${import.meta.env.VITE_BACKEND_URL}${message.fileUrl}`, '_blank')}
              />
              {message.content && (
                <p className="text-sm mt-2 break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2">
              <a
                href={`${import.meta.env.VITE_BACKEND_URL}${message.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline break-all"
                download={message.fileName}
              >
                📎 {message.fileName || 'Download file'}
              </a>
            </div>
          );
        }
      case 'sticker':
        return (
          <div className="relative">
            <div className="text-4xl">{message.content}</div>
          </div>
        );
      default:
        return <p className="text-sm">Unsupported message type</p>;
    }
  };

  return (
    <div className={`flex items-end space-x-2 group ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <img
          src={message.user.avatar}
          alt={message.user.username}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs md:max-w-md`}>
        {/* Username and time */}
        {showAvatar && (
          <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {isOwnMessage ? 'You' : message.user.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.createdAt)}
            </span>
            {message.isPinned && (
              <Pin className="h-3 w-3 text-yellow-500" />
            )}
          </div>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div
            className={`
              ${isOwnMessage 
                ? 'bg-blue-500 text-white rounded-2xl rounded-br-md' 
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-md border border-gray-200 dark:border-gray-600'
              } px-4 py-2 shadow-lg relative group-hover:shadow-xl transition-shadow duration-200
            `}
            onDoubleClick={() => setShowReactions(!showReactions)}
          >
            {renderMessageContent()}
            
            {/* Message menu */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-600 text-white rounded-full p-1 shadow-lg"
            >
              <MoreVertical className="h-3 w-3" />
            </button>

            {showMenu && (
              <div className="absolute top-6 right-0 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10">
                <button
                  onClick={copyMessage}
                  className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => {
                    setShowReactions(!showReactions);
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                >
                  <span>😊</span>
                  <span>React</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick reaction picker */}
          {showReactions && (
            <div className="absolute top-full mt-1 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 px-2 py-1 flex space-x-1 z-10">
              {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-lg hover:scale-125 transition-transform duration-200"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(
                message.reactions.reduce((acc, reaction) => {
                  if (!acc[reaction.emoji]) {
                    acc[reaction.emoji] = [];
                  }
                  acc[reaction.emoji].push(reaction);
                  return acc;
                }, {})
              ).map(([emoji, reactionList]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full px-2 py-1 text-xs transition-colors"
                  title={`${reactionList.map(r => r.user.username).join(', ')} reacted with ${emoji}`}
                >
                  <span>{emoji}</span>
                  <span className="text-gray-600 dark:text-gray-400">{reactionList.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;