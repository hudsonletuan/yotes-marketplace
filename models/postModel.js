const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    image: String,
    price: Number,
    tag: String,
    status: String
}, {timestamps: true});

module.exports = mongoose.model('Post', postSchema);
