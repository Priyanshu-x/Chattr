const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
    messageExpiry: {
        type: Number,
        default: 24, // hours
        min: 1,
        max: 168
    },
    maxFileSize: {
        type: Number,
        default: 10, // MB
        min: 1,
        max: 100
    },
    allowImages: {
        type: Boolean,
        default: true
    },
    allowVoice: {
        type: Boolean,
        default: true
    },
    allowStickers: {
        type: Boolean,
        default: true
    },
    maxUsersOnline: {
        type: Number,
        default: 100
    },
    rateLimitMessages: {
        type: Number,
        default: 10 // messages per window
    },
    rateLimitWindow: {
        type: Number,
        default: 60 // seconds
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
    }
});

// Singleton pattern: ensure only one settings document exists
globalSettingsSchema.statics.getSettings = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    return await this.create({});
};

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
