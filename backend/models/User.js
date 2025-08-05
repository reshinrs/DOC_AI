const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

// The combined User Schema
const UserSchema = new Schema({
    /**
     * The user's unique username. It is required, must be unique, and will be trimmed of whitespace.
     */
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    /**
     * The user's unique email address. It is required, must be unique, will be trimmed, and stored in lowercase.
     */
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    /**
     * The user's password. It is required and will be hashed before saving.
     */
    password: {
        type: String,
        required: true
    },
    /**
     * The user's role, which determines their permissions within the application.
     * It can only be 'User' or 'Admin'.
     */
    role: {
        type: String,
        enum: ['User', 'Admin'], // Defines the possible values for the role
        default: 'User' // Sets a default role for new users
    },
    /**
     * The timestamp for when the user account was created.
     */
    createdAt: {
        type: Date,
        default: Date.now
    },
});

/**
 * Mongoose 'pre-save' hook to automatically hash the user's password
 * before it is saved to the database. This hook only runs if the password
 * has been modified to avoid re-hashing an already hashed password.
 */
UserSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('User', UserSchema);