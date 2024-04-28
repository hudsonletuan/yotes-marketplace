import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
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
    ]
}, { timestamps: true });

export default mongoose.model('Post', postSchema);