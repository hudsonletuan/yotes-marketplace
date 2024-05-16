import moongose from 'mongoose';

const messageSchema = new moongose.Schema({
    userRole: {
        type: String,
    },
    userId: {
        type: String,
    },
    username: {
        type: String,
    },
    content: {
        type: String,
    },
    uploaded: [
        {
            media: {
                type: String,
            },
        },
    ],
    status: {
        type: String,
        enum: ['seen', 'unseen'],
        default: 'unseen',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const conversationSchema = new moongose.Schema({
    postId: {
        type: String,
    },
    postTopic: {
        type: String,
    },
    postUserId: {
        type: String,
    },
    postUsername: {
        type: String,
    },
    postUserImg: {
        type: String,
    },
    selfUserId: {
        type: String,
    },
    selfUsername: {
        type: String,
    },
    selfUserImg: {
        type: String,
    },
    messages: [messageSchema],
}, { timestamps: true });

export default moongose.model('Conversation', conversationSchema);