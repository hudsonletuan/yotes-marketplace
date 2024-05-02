import mongoose from "mongoose";

const postVersionSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    userImg: {
        type: String,
    },
    caption: {
        type: String,
    },
    price: {
        type: Number,
    },
    status: {
        type: String,
    },
    location: {
        type: String,
    },
    uploaded: [
        {
            media: {
                type: String,
            },
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const postSchema = new mongoose.Schema({
    userId: {
        type: String,
    },
    username: {
        type: String,
    },
    userImg: {
        type: String,
    },
    versions: [postVersionSchema],
}, { timestamps: true });

export default mongoose.model('Post', postSchema);