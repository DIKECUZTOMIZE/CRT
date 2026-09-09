import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        index: true,
        unique: true,
    },
    refreshToken: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + SESSION_TTL_MS),
        expires: SESSION_TTL_SECONDS,
    }
}, {
    timestamps: true
})

sessionSchema.pre('save', async function () {
    if (this.isModified('refreshToken') && !this.refreshToken.startsWith('$2')) {
        const salt = await bcrypt.genSalt(10);
        this.refreshToken = await bcrypt.hash(this.refreshToken, salt);
    }

    if (this.isModified('refreshToken') || !this.expiresAt || this.expiresAt <= new Date()) {
        this.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    }
})

sessionSchema.methods.compareRefreshToken = async function (refreshToken) {
    return await bcrypt.compare(refreshToken, this.refreshToken);
}

const SessionModel = mongoose.model('Session', sessionSchema);

export default SessionModel;