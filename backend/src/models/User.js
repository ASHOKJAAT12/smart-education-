const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [60, 'Name must be at most 60 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // never returned by default in queries
        },
        role: {
            type: String,
            enum: ['student', 'teacher', 'admin'],
            default: 'student',
        },
        profilePicture: {
            type: String,
            default: null,
        },
        // Student-specific onboarding fields (populated in Phase 4)
        course: {
            type: String,
            default: null,
        },
        semester: {
            type: String,
            default: null,
        },
        learningGoal: {
            type: String,
            default: null,
        },
        dailyStudyTime: {
            type: Number, // minutes per day
            default: null,
        },
        // Auth state
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        // Password reset
        passwordResetToken: {
            type: String,
            default: null,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            default: null,
            select: false,
        },
        // Refresh token (stored hashed, used to invalidate on logout)
        refreshToken: {
            type: String,
            default: null,
            select: false,
        },
        lastLoginAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // createdAt + updatedAt
    }
);

// ─── Indexes ───────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// ─── Pre-save hook — hash password ─────────────────────────────────────────
userSchema.pre('save', async function (next) {
    // Only hash if password was modified
    if (!this.isModified('password')) return next();
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, rounds);
    next();
});

// ─── Instance method — compare password ────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method — safe public profile (no passwords/tokens) ───────────
userSchema.methods.toSafeObject = function () {
    return {
        _id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        profilePicture: this.profilePicture,
        course: this.course,
        semester: this.semester,
        learningGoal: this.learningGoal,
        dailyStudyTime: this.dailyStudyTime,
        isEmailVerified: this.isEmailVerified,
        isActive: this.isActive,
        lastLoginAt: this.lastLoginAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
