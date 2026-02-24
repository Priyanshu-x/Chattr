// frontend/src/components/chat/MessageBubble.jsx - WORKING VERSION
import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { formatTime } from '../../utils/helpers';
import { Pin, MoreVertical, Copy, Reply, FileText, Download } from 'lucide-react';
import DOMPurify from 'dompurify'; // Import DOMPurify

const MessageBubble = ({ message, isOwnMessage, showAvatar, onReply }) => {
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

  // Helper to handle both local (relative) and Cloudinary (absolute) URLs
  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // Already valid absolute URL (Cloudinary)
    return `${import.meta.env.VITE_BACKEND_URL}${url}`; // Local path
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'text':
        return (
          <p
            className="text-sm break-words whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }}
          />
        );
      case 'image':
        return (
          <div className="relative">
            <img
              src={getFileUrl(message.fileUrl)}
              alt="Shared image"
              className="max-w-full sm:max-w-[250px] max-h-[300px] object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(getFileUrl(message.fileUrl), '_blank', 'noopener,noreferrer')}
            />
            {message.content && (
              <p
                className="text-sm mt-2 break-words whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }}
              />
            )}
          </div>
        );
      case 'voice':
        return (
          <div className="flex items-center space-x-3 py-2">
            <button className="w-10 h-10 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center">
              ▶️
            </button>
            <div className="flex-1">
              <div className="text-sm text-gray-600 dark:text-gray-400">Voice message</div>
              <audio controls className="mt-1">
                <source src={getFileUrl(message.fileUrl)} type="audio/webm" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );
      case 'file':
        // Generic file card for ALL 'file' types (even if extension is image/video)
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600 max-w-full overflow-hidden">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {message.fileName || 'Unknown File'}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <a
                  href={getFileUrl(message.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={message.fileName || 'file'}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline flex items-center space-x-1"
                >
                  <Download className="h-3 w-3" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        );
      case 'announcement':
        const bgStyles = {
          info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
          danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
        }[message.announcementType] || 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';

        return (
          <div className={`w-full py-3 px-6 rounded-xl text-center font-medium border shadow-sm ${bgStyles}`}>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">📢</span>
              <p
                className="text-sm sm:text-base break-words"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.content) }}
              />
            </div>
          </div>
        );
      default:
        return <p className="text-sm">Unsupported message type</p>;
    }
  };

  if (message.type === 'announcement') {
    return (
      <div className="flex justify-center w-full px-4 py-2">
        <div className="max-w-2xl w-full">
          {renderMessageContent()}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end space-x-2 group ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <img
          src={DOMPurify.sanitize(message.user.avatar)}
          alt={DOMPurify.sanitize(message.user.username)}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
      )}

      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-xs md:max-w-md`}>
        {/* Username and time */}
        {showAvatar && (
          <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <span
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(isOwnMessage ? 'You' : message.user.username) }}
            />
            {message.user.username === 'Kira' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-500 text-white uppercase tracking-wider">
                AI / KIRA
              </span>
            )}
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
                ? 'chat-bubble-user'
                : 'chat-bubble-other'
              } relative group-hover:shadow-xl transition-shadow duration-200
            `}
            onDoubleClick={() => setShowReactions(!showReactions)}
          >
            {message.replyTo && (
              <div
                className={`mb-2 p-2 rounded-lg text-xs cursor-pointer border-l-4 opacity-90 ${isOwnMessage
                  ? 'bg-white/10 border-white/50 text-white dark:text-gray-900 dark:bg-gray-100 dark:border-gray-200'
                  : 'bg-gray-100 dark:bg-gray-600 border-primary-500 text-gray-800 dark:text-gray-200'
                  }`}
              >
                <div className="font-bold mb-0.5">
                  {message.replyTo.user?.username || 'Unknown'}
                </div>
                <div className="truncate max-w-[150px] sm:max-w-[200px]">
                  {message.replyTo.type === 'text'
                    ? message.replyTo.content
                    : `${message.replyTo.type === 'image' ? '📷 ' : message.replyTo.type === 'voice' ? '🎤 ' : '📎 '}${message.replyTo.type === 'image' ? 'Image' : message.replyTo.type === 'voice' ? 'Voice Message' : 'File'}`
                  }
                </div>
              </div>
            )}
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
                  onClick={() => {
                    onReply(message);
                    setShowMenu(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left"
                >
                  <Reply className="h-4 w-4" />
                  <span>Reply</span>
                </button>
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
                  title={DOMPurify.sanitize(`${reactionList.map(r => r.user.username).join(', ')} reacted with ${emoji}`)}
                >
                  <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(emoji) }} />
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