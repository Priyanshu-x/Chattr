const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  type: { type: String, enum: ['text', 'image', 'voice', 'file'], default: 'text' },
  imageUrl: { type: String },
  voiceUrl: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  isPinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  reactions: [
    {
      emoji: { type: String, required: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    }
  ]
});

MessageSchema.index({ createdAt: 1 });
MessageSchema.index({ user: 1, createdAt: -1 });
MessageSchema.index({ isPinned: 1, createdAt: -1 });
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Ensure this index is active

module.exports = mongoose.model('Message', MessageSchema);
