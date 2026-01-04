const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  type: { type: String, enum: ['text', 'image', 'voice', 'file'], default: 'text' },
  // These fields should store paths to internally managed files, not arbitrary external URLs
  imageUrl: { type: String, default: null },
  voiceUrl: { type: String, default: null },
  fileUrl: { type: String, default: null },
  fileName: { type: String },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  reactions: [
    {
      emoji: { type: String, required: true }, // Emojis are generally safe, but XSS sanitization in frontend rendering is crucial.
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    }
  ]
});

MessageSchema.index({ createdAt: 1 });
MessageSchema.index({ user: 1, createdAt: -1 });
MessageSchema.index({ isPinned: 1, createdAt: -1 });
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Ensure this index is active

module.exports = mongoose.model('Message', MessageSchema);
