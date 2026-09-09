import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { ROLES } from "../constant/model.constant.js";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;
        },
        trim: true,
        default: "",
    },
    role: {
        type: String,
        enum: Object.values(ROLES),
        default: ROLES.USER
    },
    fullName: {
        type: String,
        default: "",
        trim: true,
    },
    roleTitle: {
        type: String,
        default: "",
        trim: true,
    },
    phone: {
        type: String,
        default: "",
        trim: true,
    },
    googleId: {
        type: String,
        default: undefined,
        trim: true,
        unique: true,
        sparse: true,
        index: true,
        set: (value) => {
            const normalized = String(value ?? "").trim();
            return normalized || undefined;
        },
    },
    avatar: {
        type: String,
        default: "",
        trim: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    organizationName: {
        type: String,
        default: "",
        trim: true,
    },
    organizationType: {
        type: String,
        default: "",
        trim: true,
    },
    website: {
        type: String,
        default: "",
        trim: true,
    },
    address: {
        type: String,
        default: "",
        trim: true,
    },
    bio: {
        type: String,
        default: "",
        trim: true,
    },
    kycStatus: {
        type: String,
        default: "",
        trim: true,
    },
    kycDocumentType: {
        type: String,
        default: "",
        trim: true,
    },
    kycVerifiedAt: {
        type: String,
        default: "",
        trim: true,
    },
    socials: {
        instagram: { type: String, default: "", trim: true },
        twitter: { type: String, default: "", trim: true },
        linkedin: { type: String, default: "", trim: true },
    },
    settings: {
        emailNotifications: { type: Boolean, default: true },
        publicProfile: { type: Boolean, default: true },
    },
    stats: {
        totalEvents: { type: Number, default: 0 },
        activeEvents: { type: Number, default: 0 },
        totalAttendees: { type: String, default: "" },
        rating: { type: Number, default: 0 },
    },
    savedEvents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "events",
        default: [],
    }],
}, {
    timestamps: true
})

userSchema.index(
    { role: 1 },
    {
        name: "idx_users_role",
    }
);

userSchema.pre('save', async function () {
    if (this.isModified('username')) {
        this.username = String(this.username ?? "").trim();
    }

    if (this.isModified('email')) {
        this.email = String(this.email ?? "").trim().toLowerCase();
    }

    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isModified('googleId')) {
        const normalizedGoogleId = String(this.googleId ?? "").trim();
        this.googleId = normalizedGoogleId || undefined;
    }
})

userSchema.statics.cleanupEmptyGoogleIds = async function () {
    await this.updateMany({ googleId: "" }, { $unset: { googleId: "" } });
};

userSchema.methods.comparePassword = async function (password) {
    if (!this.password) {
        return false;
    }

    return await bcrypt.compare(password, this.password);
}

const UserModel = mongoose.model("users", userSchema);

export default UserModel;

// js doc strinfg