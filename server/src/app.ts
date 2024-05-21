import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import path from 'path';
import apiRouter from './routes/api';
import User from './models/userModel';
import Post from './models/postModel';
import Conversation from './models/conversationModel';
// import ffmpegPath from '@ffmpeg-installer/ffmpeg';
// import ffmpeg from 'fluent-ffmpeg';
// ffmpeg.setFfmpegPath(ffmpegPath.path);

const app = express();
app.use(cors());
app.use(cookieParser());

const uri = process.env.MONGODB_URI!;
const port = process.env.PORT!;

app.use(express.static(path.join(__dirname, 'public')));

const connectDB = async () => {
    try {
        await mongoose.connect(uri);
        // console.log('MongoDB connected');
    } catch (error) {
        // console.log(error);
    }
};
connectDB();

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
app.use(express.json());
app.use('/api', apiRouter);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});


// const command = ffmpeg("../public/videotest.avi")
//     .videoCodec('libx264')
//     .audioCodec('libmp3lame')
//     .format('mp4');

// command.clone()
//   .size('320x200')
//   .save('../public/output-small.mp4');

// // Create a clone to save a medium resized version
// command.clone()
//   .size('640x400')
//   .save('../public/output-medium.mp4');

// // Save a converted version with the original size
// command.save('../public/output-original-size.mp4');

// const tryFFmpeg = async () => {
//     try {
//         // Dynamically construct the path to the input video file
//         const inputFilePath = 'D:/COMPUTERSCIENCE/PROJECTS/Yotes/market-place/server/src/testvideo.mp4';

//         await ffmpeg(inputFilePath)
//            .videoCodec('libx264')
//            .audioCodec('libmp3lame')
//            .format('mp4')
//            .size('320x200')
//            .save(path.join(__dirname, '..', 'output-small.mp4'))
//            .on('error', function(err, stdout, stderr) {
//                 if (err) {
//                     console.log(err.message);
//                     console.log("stdout:\n" + stdout);
//                     console.log("stderr:\n" + stderr);
//                 }
//             });
//         console.log('FFmpeg success');
//     } catch (error) {
//         console.log(error);
//     }
// }

// tryFFmpeg();

// const command = ffmpeg("videotest.avi")
//     .videoCodec('libx264')
//     .audioCodec('libmp3lame')
//     .format('mp4');

// command.clone()
//   .size('320x200');
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const S3 = new S3Client({
    region: "auto",
    endpoint: process.env.CF_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.CF_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CF_SECRET_ACCESS_KEY!,
    },
});

io.on('connection', (socket) => {
    socket.on('updateUserStatus', async ({ userId, userStatus }) => {
        try {
            const user = await User.findByIdAndUpdate(userId);
            if (user) {
                const updateUser = await User.findByIdAndUpdate(userId, { userStatus, socketId: socket.id }, { new: true });
                // console.log("IO connect:", updateUser);
                io.emit('userStatusUpdate', { userId, userStatus });
            } else {
                // console.log('User not found');
            }
        } catch (error) {
            // console.log(error);
        }
    });
    socket.on('disconnect', async () => {
        try {
            const user = await User.findOne({ socketId: socket.id });
            if (user) {
                const updateUser = await User.findByIdAndUpdate(user._id, { userStatus: 'Offline', socketId: null, lastActive: new Date() }, { new: true });
                // console.log("IO disconnect:", updateUser);
                io.emit('userStatusUpdate', { userId: user._id, userStatus: 'Offline', lastActive: new Date() });
            } else {
                // console.log('User not found');
            }
        } catch (error) {
            // console.log(error);
        }
    });
    socket.on('fetchChatHistory', async (conversationId) => {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (conversation) {
                socket.emit('chatHistory', conversation.postId, conversation._id, conversation.toObject().messages );
            } else {
                // console.log('Conversation not found');
            }
        } catch (error) {
            // console.log(error);
        }
    });
    socket.on('fetchChatList', async (userId) => {
        try {
            const conversations = await Conversation.find({ $or: [{ postUserId: userId }, { selfUserId: userId }] });
            const filteredConversations = conversations.filter((conversation) => conversation.messages.length > 0);
            if (filteredConversations.length > 0) {
                socket.emit('chatList', filteredConversations);
            } else {
                // console.log('Conversations not found');
            }
        } catch (error) {
            // console.log(error);
        }
    });
    socket.on('sendMessage', async (data) => {
        try {
            const conversation = await Conversation.findById(data.conversationId);
            if (conversation) {
                await Conversation.findByIdAndUpdate(data.conversationId, { messages: [...conversation.messages, data] }, { new: true });
                socket.join(data.conversationId);
                io.to(data.conversationId).emit('chatHistory', conversation.toObject().messages);
                const updatedConversation = await Conversation.findById(data.conversationId);
                const sender = await User.findById(data.userId);
                if (sender) {
                    const senderSocketId = sender.socketId;
                    if (senderSocketId) {
                        io.to(senderSocketId).emit('newMessage', updatedConversation);
                    }
                }
                
                const receiverId = conversation.postUserId === data.userId ? conversation.selfUserId : conversation.postUserId;
                const receiver = await User.findById(receiverId);
                if (receiver) {
                    const receiverSocketId = receiver.socketId;
                    if (receiverSocketId) {
                        io.to(receiverSocketId).emit('newMessage', updatedConversation);
                    }
                }
            } else {
                // console.log('Conversation not found');
            }
        } catch (error) {
            // console.log(error);
        }
    });
    socket.on('joinConversation', (conversationId) => {
        socket.join(conversationId);
    });
    socket.on('markMessagesAsSeen', async (conversationId, userId) => {
        try {
            const conversation = await Conversation.findById(conversationId);
            if (conversation && conversation.messages.length > 0) {
                let totalSeen = 0;
                conversation.messages.forEach((message) => {
                    if (message.status !== 'seen' && message.userId !== userId) {
                        totalSeen += 1;
                        message.status = 'seen';
                    }
                });
                await conversation.save();
                io.to(conversationId).emit('updateMessageStatus', conversation, totalSeen);
            } else {
                // console.log('Conversation not found');
            }
        } catch (error) {
            // console.log(error);
        }
    });
    socket.on('countUnseenMessages', async (userId) => {
        try {
            const conversations = await Conversation.find({ $or: [{ postUserId: userId }, { selfUserId: userId }] });
            let count = 0;
            conversations.forEach((conversation) => {
                conversation.messages.forEach((message) => {
                    if (message.userId !== userId && message.status !== 'seen') {
                        count += 1;
                    }
                });
            });
            socket.emit('unseenMessagesTotal', count);
        } catch (error) {
            // console.log(error);
        }
    });

    const deleteOneConversation = async (conversationId, postId, myId, clientId) => {
        try {
            const mediaUrls: string[] = [];
            const conversation = await Conversation.findById(conversationId);
            const totalMyUnseenMessages = conversation!.messages.filter((message) => message.userId !== myId && message.status !== 'seen').length;
            const totalClientUnseenMessages = conversation!.messages.filter((message) => message.userId !== clientId && message.status !== 'seen').length;
            conversation!.messages.forEach((message) => {
                if (message.uploaded) {
                    message.uploaded.forEach((media) => {
                        if (media && media.media) {
                            mediaUrls.push(media.media);
                        }
                    });
                }
            });
            const deletePromises = mediaUrls.map((mediaUrl) => {
                const key = mediaUrl?.split('/').pop();
                const deleteParams = {
                    Bucket: 'yotes-marketplace',
                    Key: key,
                };
                return S3.send(new DeleteObjectCommand(deleteParams));
            });
            await Promise.all(deletePromises);
            await Conversation.findByIdAndDelete(conversationId);
            socket.leave(conversationId);
            const myUser = await User.findById(myId);
            const clientUser = await User.findById(clientId);
            if (myUser && myUser.socketId) {
                io.to(myUser.socketId).emit('conversationDeleted', conversationId, postId, totalMyUnseenMessages);
            }
            if (clientUser && clientUser.socketId) {
                io.to(clientUser.socketId).emit('conversationDeleted', conversationId, postId, totalClientUnseenMessages);
            }
        } catch (error) {
            // console.log(error);
        }
    };

    socket.on('deleteConversation', async (conversationId, postId, myId, clientId) => {
        deleteOneConversation(conversationId, postId, myId, clientId);
    });
    socket.on('deletePost', async (postId, userId) => {
        try {
            const post = await Post.findById(postId);
            if (!post) {
                // return res.status(404).json({ message: 'Post not found' });
                // return console.log('Post not found');
                return;
            }
            const mediaUrls = post.versions.flatMap((version) => version.uploaded.map((file) => file.media));
            const deletePromises = mediaUrls.map((mediaUrl) => {
                if (!mediaUrl) {
                    return;
                }
                const key = mediaUrl?.split('/').pop();
                const deleteParams = {
                    Bucket: 'yotes-marketplace',
                    Key: key,
                };
                return S3.send(new DeleteObjectCommand(deleteParams));
            });
            await Promise.all(deletePromises);

            const postConversations = await Conversation.find({ postId });
            if (postConversations.length > 0) {
                postConversations.forEach((conversation) => {
                    const clientId = conversation.postUserId === userId ? conversation.selfUserId : conversation.postUserId;
                    deleteOneConversation(conversation._id, postId, userId, clientId);
                });
            }
            await Post.findByIdAndDelete(postId);
            // res.status(200).json({ message: 'Post deleted successfully' });
            // socket.emit('postDeleted', postId, userId);
            io.emit('postDeleted', postId, userId); // broadcast to all connected clients
        } catch (error) {
            // res.status(500).json({ message: 'Error deleting post', error });
            //console.log(error);
        }
    });
});

server.listen(port, () => {
    // console.log(`Socket.io server is running on port ${port}`);
});