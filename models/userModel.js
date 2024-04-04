const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        trim: true,
        match: [/^[a-zA-Z0-9]+$/, 'is invalid'],
        minlength: 3,
        index: true
    },
    email: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        trim: true,
        match: [/\S+@\S+\.\S+/, 'is invalid'],
        index: true
    },
    password: {
        type: String,
        required: true
    }
}, {timestamps: true});

module.exports = mongoose.model('User', userSchema);