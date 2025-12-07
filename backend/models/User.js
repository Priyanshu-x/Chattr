const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: false, select: false },
	avatar: { type: String },
	joinedAt: { type: Date, default: Date.now },
	messageCount: { type: Number, default: 0 },
	isBanned: { type: Boolean, default: false },
	ip: { type: String }
});

UserSchema.index({ ip: 1 });

UserSchema.pre('save', async function (next) {
	if (this.password && this.isModified('password')) {
		this.password = await bcrypt.hash(this.password, 10);
	}
	next();
});

UserSchema.methods.comparePassword = function (candidatePassword) {
	return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
