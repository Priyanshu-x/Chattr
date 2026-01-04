import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Send, Image, Mic, MicOff, Smile, Reply } from 'lucide-react';
import api from '../../utils/api';

const MessageInput = ({ replyingTo, setReplyingTo }) => {
  const { sendMessage, startTyping, stopTyping, user } = useSocket();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Handle typing indicators
    startTyping();
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || isUploading || !user) return;

    let messageData = {
      content: message.trim(),
      type: 'text',
      replyTo: replyingTo?._id
    };

    // Handle file upload
    if (selectedFile) {
      try {
        setIsUploading(true);
        const formData = new FormData();
        if (selectedFile.type.startsWith('image/')) {
          formData.append('image', selectedFile);
          const response = await api.post('/api/chat/upload/image', formData);
          messageData.type = 'image';
          messageData.fileUrl = response.data.fileUrl;
          messageData.fileName = response.data.fileName;
        } else if (selectedFile.type.startsWith('audio/')) {
          formData.append('voice', selectedFile);
          const response = await api.post('/api/chat/upload/voice', formData);
          messageData.type = 'voice';
          messageData.fileUrl = response.data.fileUrl;
          messageData.fileName = response.data.fileName;
        } else {
          formData.append('file', selectedFile);
          const response = await api.post('/api/chat/upload/file', formData);
          messageData.type = 'file';
          messageData.fileUrl = response.data.fileUrl;
          messageData.fileName = response.data.fileName;
          messageData.fileType = response.data.fileType;
        }
      } catch (error) {
        console.error('File upload failed:', error);
        alert('Failed to upload file');
        setIsUploading(false);
        return;
      }
    }

    console.log('Sending message:', messageData);
    sendMessage(messageData);
    setMessage('');
    setSelectedFile(null);
    setFilePreview(null);
    setIsUploading(false);
    stopTyping();
    if (setReplyingTo) setReplyingTo(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordingChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
        setSelectedFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStickerSelect = (emoji) => {
    sendMessage({
      type: 'sticker',
      content: emoji
    });
    setShowStickers(false);
  };

  const emojis = ['😀', '😂', '🥰', '😎', '🤔', '😴', '🐶', '🐱', '🦄', '🐼', '🍕', '🍔', '🍰', '🍎'];

  if (!user) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          Please join the chat to send messages
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Sticker Picker */}
      {showStickers && (
        <div className="absolute bottom-full mb-2 left-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Stickers</h3>
          <div className="grid grid-cols-8 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleStickerSelect(emoji)}
                className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File Preview */}
      {(filePreview || selectedFile) && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {filePreview ? (
                <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 bg-gray-800 dark:bg-gray-600 rounded flex items-center justify-center">
                  <Mic className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedFile?.name || 'Voice message'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <Reply className="h-5 w-5 text-gray-500" />
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Replying to <span className="font-bold">{replyingTo.user?.username || 'Unknown'}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {replyingTo.type === 'text'
                    ? replyingTo.content
                    : `${replyingTo.type === 'image' ? '📷 ' : replyingTo.type === 'voice' ? '🎤 ' : '📎 '}${replyingTo.type === 'image' ? 'Image' : replyingTo.type === 'voice' ? 'Voice Message' : 'File'}`
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end space-x-2 p-2 sm:p-4">
        {/* Action Buttons */}
        <div className="flex space-x-1">
          {/* Image Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full transition-colors"
            disabled={isUploading}
          >
            <Image className="h-5 w-5" />
          </button>

          {/* Voice Recording */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-full transition-colors ${isRecording
              ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
              : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Stickers */}
          <button
            onClick={() => setShowStickers(!showStickers)}
            className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full transition-colors"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isRecording ? "Recording..." : "Type a message..."}
            disabled={isRecording || isUploading}
            className="w-full resize-none bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            rows={1}
          />

          {isRecording && (
            <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={(!message.trim() && !selectedFile) || isUploading}
          className="p-2 sm:p-3 bg-primary-500 text-white rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed,application/octet-stream,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;

