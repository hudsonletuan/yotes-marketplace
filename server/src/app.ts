import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import axios from 'axios';
import bcrypt from 'bcrypt';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import Post from '../models/postModel';
import User from '../models/userModel';

const app = express();
app.use(cors());
app.use(cookieParser());

const uri = process.env.MONGODB_URI!;
const port = process.env.PORT!;

const connectDB = async () => {
    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected');
    } catch (error) {
        console.log(error);
    }
};

connectDB();

app.get('/mongo', (req, res) => {
    if (mongoose.connection.readyState === 1) {
        const message = 'is Connected';
        res.send(message);
        res.send('MongoDB connected');
    } else {
        res.send('MongoDB not connected');
    };
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/newpost', upload.array('media'), async (req, res) => {
    try {
        const { username, caption, price, status, location } = req.body;
        const media = (req.files as Express.Multer.File[]).map(file => ({
            media: file.buffer.toString('base64')
        }));
        const newPost = new Post({ username, caption, price, status, location, uploaded: media });
        await newPost.save();
        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        res.status(500).json({ message: 'Post creation failed', error });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        let user = await User.findOne({ $or: [{ username }, { email }] });
        let failedMessage = 'User not found';
        if (username === undefined) {
            user = await User.findOne({ email });
            failedMessage = 'Email not found';
        } else if (email === undefined) {
            user = await User.findOne({ username });
            failedMessage = 'Username not found';
        }
        if (!user) {
            return res.status(400).json({ message: failedMessage });
        }
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const userInfo = { id: user._id, username: user.username, email: user.email, img: user.img};
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
        res.status(200).json({ message: 'Login successful', user: userInfo });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error });
    }
});

app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        let userUsername = await User.findOne({ username });
        let userEmail = await User.findOne({ email });
        if (userUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        if (userEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'Signup successful', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Signup failed', error });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});