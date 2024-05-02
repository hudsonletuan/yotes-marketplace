import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import mongoose from 'mongoose';
import AWS from 'aws-sdk';
import nodemailer from 'nodemailer';
import Post from '../models/postModel';
import User from '../models/userModel';

const router = Router();

router.get('/mongo', (req, res) => {
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

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = (email: string, otp: string) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Yotes Marketplace OTP',
        text: `Your OTP is ${otp}`
    };

    let transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

router.post('/login', async (req, res) => {
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

const otpCache: { [key: string]: { otp: string, expiresAt: number } } = {};

router.post('/signup', async (req, res) => {
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

        const newUserInfo = { username: username, email: email, password: hashedPassword };

        const otp = generateOTP();
        otpCache[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
        sendOTP(email, otp);

        // const newUser = new User({ username, email, password: hashedPassword });
        // await newUser.save();
        res.status(200).json({ message: 'OTP sent successful', otpCache, newUserInfo });
    } catch (error) {
        res.status(500).json({ message: 'Signup failed', error });
    }
});

router.post('/resendOTP', async (req, res) => {
    try {
        const { email } = req.body;
        if (!otpCache.hasOwnProperty(email)) {
            return res.status(400).json({ message: 'Email not found' });
        }
        const otp = generateOTP();
        otpCache[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
        sendOTP(email, otp);
        res.status(200).json({ message: 'OTP resent successful', otpCache });
    } catch (error) {
        res.status(500).json({ message: 'Resend OTP failed', error });
    }
});

router.post('/signupVerify', async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if(!otpCache.hasOwnProperty(email)) {
            return res.status(400).json({ message: 'Email not found' });
        }
        if (Date.now() > otpCache[email].expiresAt) {
            delete otpCache[email];
            return res.status(400).json({ message: 'OTP expired' });
        }
        if (otpCache[email].otp !== otp.trim()) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (otpCache[email].otp === otp.trim()) {
            delete otpCache[email];
            const { username } = req.body;
            const newUser = new User({ username, email, password: password });
            await newUser.save();

            let user = await User.findOne({ $or: [{ username }, { email }] });
            if (!user) {
                return res.status(400).json({ message: 'User is not yet in the database' });
            }
            const userInfo = { id: user._id, username: user.username, email: user.email, img: user.img};
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
            res.status(200).json({ message: 'Signup successfully', user: userInfo });
        } else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error verifying OTP', error });
    }
});

router.get('/posts', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;

    try {
        const posts = await Post.find({}).sort({ 'versions.createdAt': -1 }).skip(skip).limit(limit);
        res.status(200).json({ posts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching posts', error });
    }
});


const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

router.post('/newpost', upload.array('media'), async (req, res) => {
    try {
        const { userId, username, userImg, caption, price, status, location } = req.body;
        const mediaPromises = (req.files as Express.Multer.File[]).map(async (file) => {
            const params = {
                Bucket: 'yotes-marketplace',
                Key: `${userId}-${username}-${Date.now()}-${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
            };
            const data = await s3.upload(params).promise();
            return { media: data.Location };
        });
        const media = await Promise.all(mediaPromises);
        const newVersion = { userId, username, userImg, caption, price, status, location, uploaded: media };
        const newPost = new Post({ userId, username, userImg, versions: [newVersion] });
        await newPost.save();
        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Post creation failed', error });
    }
});

router.get('/userposts', async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;
    const username = req.query.username as string;

    try {
        const posts = await Post.find({ username }).sort({ 'versions.createdAt': -1 }).skip(skip).limit(limit);
        res.status(200).json({ posts });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching posts', error });
    }
});

router.delete('/deletepost/:id', async (req, res) => {
    const postId = req.params.id;
    try {
        const post = await Post.findByIdAndDelete(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting post', error });
    }
});

router.put('/editpost/:id', upload.array('media'), async (req, res) => {
    try {
        const postId = req.params.id;
        const { userId, username, userImg, caption, price, status, location, existingMediaUrls } = req.body;
        const newMediaPromises = (req.files as Express.Multer.File[]).map(async (file) => {
            const params = {
                Bucket: 'yotes-marketplace',
                Key: `${userId}-${username}-${Date.now()}-${file.originalname}`,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: 'public-read',
            };
            const data = await s3.upload(params).promise();
            return { media: data.Location };
        });
        const newMedia: { media?: string | null | undefined; }[] = await Promise.all(newMediaPromises);
        const parsedExistingMediaUrls = JSON.parse(existingMediaUrls);
        const existingMediaUrlsMroutered = parsedExistingMediaUrls.map((url: string) => ({ media: url }));

        const updatedPost = await Post.findByIdAndUpdate(postId, { userId, username, userImg, $push: { versions: { userId, username, userImg, caption, price, status, location, uploaded: [...existingMediaUrlsMroutered, ...newMedia] } } }, { new: true });
        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        } else {
            res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating post', error });
    }
});

export default router;