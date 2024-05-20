import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import nodemailer from 'nodemailer';
import Post from '../models/postModel';
import User from '../models/userModel';
import Conversation from '../models/conversationModel';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
ffmpeg.setFfmpegPath(ffmpegPath.path);

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = (email: string, otp: string, type: string) => {
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Marketplace ${type} OTP`,
        //text: `Your Yotes Markeplace OTP is ${otp}.`
        html: `
        <h3>Your Marketplace OTP is ${otp}.</h3>
        <p>This code is only valid for 5 minutes!</p>
        <p>Do not share this code with anyone!</p>
        `
        // html: `
        // <!DOCTYPE html>
        // <html lang="en">
        // <head>
        //     <meta charset="UTF-8">
        //     <link rel="icon" href="/favicon.ico">
        //     <link rel="preconnect" href="https://fonts.googleapis.com">
        //     <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        //     <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
        //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
        //     <title>Yotes Marketplace</title>
        // </head>
        // <body style="font-family: 'Open Sans', sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 0; padding: 0; box-sizing: border-box;">
        //     <div style="background-color: #7746C1; width: 755px; height: 40vh; padding-top: 30px;">
        //         <div style="display: flex; justify-content: space-between; align-items: center; margin: 0 85px 20px 75px;">
        //             <img src="https://marketplace.tuanle.top/branding.png" alt="Yotes Marketplace" style="width: 250px;">
        //             <h2 style="color: white">${formattedDate}</h2>
        //         </div>
        //         <div style="display: flex; align-items: center; flex-direction: column;">
        //             <div style="z-index: 100; background-color: #FFFFFF; width: 580px; height: 50vh; display: flex; flex-direction: column; align-items: center; border-radius: 20px;">
        //                 <img src="https://marketplace.tuanle.top/password-svgrepo-com.png" alt="" style="height: 100px; width: 100px; margin-top: 30px;" />
        //                 <h2 style="margin: 0;">THIS IS YOUR ONE-TIME OTP CODE</h2>
        //                 <h5 style="margin: 10px 0 0 0; color: red;">DO NOT SHARE WITH ANYBODY</h5>
        //                 <p style="font-size: 100px; margin: 0; color: #7746C1; font-weight: bold; letter-spacing: 5px;">${otp}</p>
        //                 <p style="margin: 0;">This code is only valid for 5 minutes!</p>
        //             </div>
                    
        //         </div>
        //     </div>
        //     <div style="background-color: #dfcaff; width: 755px; height: 60vh; display: flex; align-items: flex-end; justify-content: center;">
        //         <div style="display: flex; flex-direction: column;">
        //             <div class="contact" style="margin-bottom: 10px;">
        //                 <h3 style="text-align: center; color: #646464; margin: 20px 0 0 0;">Need Help?</h3>
        //                 <p style="text-align: center; color: #646464; margin: 0;">Feel free to contact me at <a style="color: #7746C1; text-decoration: none; font-weight: bold;" href="mailto:tuan.le@yotes.collegeofidaho.edu">tuan.le@yotes.collegeofidaho.edu</a></p>
        //             </div>
        //             <hr style="border: 1px solid #646464; width: 500px;" />
        //             <div class="address" style="margin-bottom: 10px;">
        //                 <p style="text-align: center; color: #7746C1; margin: 0; font-size: 18px; font-weight: bold;">The College of Idaho</b>
        //                 <p style="text-align: center; color: #646464; margin: 0; font-weight: 600;">2112 Cleveland Blvd, Caldwell, ID 83605</p>
        //             </div>
        //             <div style="display: flex; justify-content: center;">
        //                 <a style="text-decoration: none; margin-right: 5px;" href="https://www.facebook.com/thecollegeofidaho/" target="_blank">
        //                     <img src="https://marketplace.tuanle.top/2021_Facebook_icon.svg.png" alt="Facebook" style="width: 40px; align-items: center;"/>
        //                 </a>
        //                 <a style="text-decoration: none; margin-top: 2px; margin-right: 5px;" href="https://x.com/collegeofidaho" target="_blank">
        //                     <img src="https://marketplace.tuanle.top/X_logo_2023.svg.png" alt="X" style="width: 42px; align-items: center;"/>
        //                 </a>
        //                 <a style="text-decoration: none; margin-right: 10px;" href="https://www.flickr.com/photos/thecollegeofidaho/albums" target="_blank">
        //                     <img src="https://marketplace.tuanle.top/Flickr_logo_-_SuperTinyIcons.svg.png" alt="Flickr" style="width: 42px; align-items: center; border-radius: 50%;"/>
        //                 </a>
        //                 <a style="text-decoration: none; margin-right: 10px;" href="https://www.instagram.com/collegeofidaho/" target="_blank">
        //                     <img src="https://marketplace.tuanle.top/Instagram_logo_2022.svg.png" alt="Instagram" style="width: 42px; align-items: center;"/>
        //                 </a>
        //                 <a style="text-decoration: none; margin-top: -1px; display: flex; align-items: center; justify-content: center;" href="https://www.youtube.com/user/goyotes" target="_blank">
        //                     <img src="https://marketplace.tuanle.top/YouTube_full-color_icon_(2017).svg.png" alt="YouTube" style="width: 42px; align-items: center;"/>
        //                 </a>
        //             </div>
        //             <div class="copyright">
        //                 <p style="text-align: center; color: #646464; margin: 0 0 30px 0;">Copyright &copy; 2024 The College of Idaho. All rights reserved.</p>
        //             </div>
        //         </div>
        //     </div>
        // </body>
        // </html>
        
        // `
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
            // console.log(error);
        } else {
            // console.log('Email sent: ' + info.response);
        }
    });
};

const sendReport = (userId: string, username: string, userEmail: string, message: string, postId: string) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'tuan.le@yotes.collegeofidaho.edu',
        subject: `Report from ${username} (${userEmail})`,
        text: `User ID: ${userId}\nUsername: ${username}\nEmail: ${userEmail}\nMessage: ${message}\nPost ID: ${postId}`,
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
            // console.log(error);
        } else {
            // console.log('Email sent: ' + info.response);
        }
    });
};

router.post('/sendreport', async (req, res) => {
    try {
        const { userId, username, userEmail, message, postId } = req.body;
        sendReport(userId, username, userEmail, message, postId);
        res.status(200).json({ message: 'Report sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending report', error });
    }
});

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
        const userInfo = { id: user._id, username: user.username, email: user.email, img: user.img, userStatus: user.userStatus, lastActive: user.lastActive };
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
        res.status(200).json({ message: 'Login successful', user: userInfo });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error });
    }
});

const otpCache: { [key: string]: { otp: string, expiresAt: number } } = {};

router.post('/recoverOTP', async (req, res) => {
    try {
        const { email, username } = req.body;
        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const userEmail = user.email;
        const otp = generateOTP();
        otpCache[userEmail] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
        sendOTP(userEmail, otp, "Recover");
        res.status(200).json({ message: 'OTP sent successful', otpCache, userEmail });
    } catch (error) {
        res.status(500).json({ message: 'Request OTP failed', error });
    }
});

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
        sendOTP(email, otp, "Signup");

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
        sendOTP(email, otp, "Signup");
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
            const userInfo = { id: user._id, username: user.username, email: user.email, img: user.img, userStatus: user.userStatus, lastActive: user.lastActive };
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
            res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
            res.status(200).json({ message: 'Signup successfully', user: userInfo });
        } else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: 'Error verifying OTP', error });
    }
});

const S3 = new S3Client({
    region: "auto",
    endpoint: process.env.CF_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.CF_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CF_SECRET_ACCESS_KEY!,
    },
});

router.post('/updateimage', upload.single('image'), async (req, res) => {
    try {
        const { userId, username } = req.body;
        const userUpdate = await User.findById(userId);
        if (!userUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }
        const userImageOldKey = userUpdate.img.split('/').pop();
        if (userImageOldKey !== 'yotes-logo.png') {
            const deleteParams = {
                Bucket: 'yotes-marketplace',
                Key: userImageOldKey,
            };
            await S3.send(new DeleteObjectCommand(deleteParams));
        }
        const file = req.file as Express.Multer.File;
        const random = Math.floor(Math.random() * 1000000);
        const imgKey = `${userId}-${username}-${Date.now()}-${random}.${file.originalname.split('.').pop()}`;
        const imgLocation = `https://marketplace.tuanle.top/${imgKey}`;
        const params = {
            Bucket: 'yotes-marketplace',
            Key: imgKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        };
        const command = new PutObjectCommand(params);
        const data = await S3.send(command);
        const user = await User.findByIdAndUpdate(userId, { img: imgLocation }, { new: true });
        const posts = await Post.updateMany({ userId }, { userImg: imgLocation });
        await Conversation.updateMany({ postUserId: userId }, { postUserImg: imgLocation });
        await Conversation.updateMany({ selfUserId: userId }, { selfUserImg: imgLocation });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'Image updated successfully', user: user });
    } catch (error) {
        res.status(500).json({ message: 'Error updating image', error });
    }
});

router.post('/changeusername', async (req, res) => {
    try {
        const { userId, newUsername, password } = req.body;
        const userName = await User.findOne({ username: newUsername });
        if (userName) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Your password is not correct' });
        }
        const updateUsername = await User.findByIdAndUpdate(userId, { username: newUsername }, { new: true });
        if (!updateUsername) {
            return res.status(400).json({ message: 'Username not updated' });
        }
        await Post.updateMany({ userId }, { username: newUsername });
        await Conversation.updateMany({ postUserId: userId }, { postUsername: newUsername });
        await Conversation.updateMany({ selfUserId: userId }, { selfUsername: newUsername });
        res.status(200).json({ message: 'Username changed successfully', username: updateUsername.username });
    } catch (error) {
        res.status(500).json({ message: 'Error changing username', error });
    }
});

router.post('/changepassword', async (req, res) => {
    try {
        const { userId, email, oldPassword, reNewPassword } = req.body;
        let user;
        if (userId) {
            user = await User.findById(userId);
        } else {
            user = await User.findOne({ email });
        }
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        const uId = user._id;
        if (oldPassword) {
            const isPasswordMatch = await user.comparePassword(oldPassword);
            if (!isPasswordMatch) {
                return res.status(400).json({ message: 'Your old password is not correct' });
            }
        }
        const hashedNewPassword = await bcrypt.hash(reNewPassword, 10);
        await User.findByIdAndUpdate(uId, { password: hashedNewPassword }, { new: true });
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error changing password', error });
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

router.post('/newpost', upload.array('media'), async (req, res) => {
    try {
        const { userId, username, userImg, topic, caption, price, status, location, selectedVideo, removedVideo } = req.body;
        const mediaPromises = (req.files as Express.Multer.File[]).map(async (file) => {
            const random = Math.floor(Math.random() * 1000000);
            const imgKey = `${userId}-${username}-${Date.now()}-${random}.${file.originalname.split('.').pop()}`;
            const imgLocation = `https://marketplace.tuanle.top/${imgKey}`;
            const params = {
                Bucket: 'yotes-marketplace',
                Key: imgKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            const command = new PutObjectCommand(params);
            const data = await S3.send(command);
            return { media: imgLocation };
        });
        const media = await Promise.all(mediaPromises);
        if (selectedVideo) {
            selectedVideo.forEach((url) => {
                media.push({ media: url });
            });
        }
        const newVersion = { userId, username, topic, caption, price, status, location, uploaded: media };
        const newPost = new Post({ userId, username, userImg, versions: [newVersion] });
        await newPost.save();

        if (removedVideo) {
            const deletePromises = removedVideo.map((url) => {
                const key = url.split('/').pop();
                const deleteParams = {
                    Bucket: 'yotes-marketplace',
                    Key: key,
                };
                return S3.send(new DeleteObjectCommand(deleteParams));
            });
            await Promise.all(deletePromises);
        }
        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        // console.log(error);
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

// router.delete('/deletepost/:id', async (req, res) => {
//     const postId = req.params.id;
//     try {
//         const post = await Post.findById(postId);
//         if (!post) {
//             return res.status(404).json({ message: 'Post not found' });
//         }
//         const mediaUrls = post.versions.flatMap((version) => version.uploaded.map((file) => file.media));
//         const deletePromises = mediaUrls.map((mediaUrl) => {
//             const key = mediaUrl?.split('/').pop();
//             const deleteParams = {
//                 Bucket: 'yotes-marketplace',
//                 Key: key,
//             };
//             return S3.send(new DeleteObjectCommand(deleteParams));
//         });
//         await Promise.all(deletePromises);
//         await Post.findByIdAndDelete(postId);
//         res.status(200).json({ message: 'Post deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Error deleting post', error });
//     }
// });

router.put('/editpost/:id', upload.array('media'), async (req, res) => {
    try {
        const postId = req.params.id;
        const { userId, username, topic, caption, price, status, location, selectedUrls, removedMediaUrls } = req.body;
        const newMediaPromises = (req.files as Express.Multer.File[]).map(async (file) => {
            const random = Math.floor(Math.random() * 1000000);
            const imgKey = `${userId}-${username}-${Date.now()}-${random}.${file.originalname.split('.').pop()}`;
            const imgLocation = `https://marketplace.tuanle.top/${imgKey}`;
            const params = {
                Bucket: 'yotes-marketplace',
                Key: imgKey,
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            const command = new PutObjectCommand(params);
            const data = await S3.send(command);
            return { media: imgLocation };
        });
        const newMedia: { media?: string | null | undefined; }[] = await Promise.all(newMediaPromises);
        const selectedUrlsArray = selectedUrls.map((url: string) => ({ media: url }));
        const parsedRemovedMediaUrls = JSON.parse(removedMediaUrls);
        const deletePromises = parsedRemovedMediaUrls.map((url) => {
            const key = url.split('/').pop();
            const deleteParams = {
                Bucket: 'yotes-marketplace',
                Key: key,
            };
            return S3.send(new DeleteObjectCommand(deleteParams));
        });

        const updatedPost = await Post.findByIdAndUpdate(postId, { userId, username, $push: { versions: { userId, username, topic, caption, price, status, location, uploaded: [...selectedUrlsArray, ...newMedia] } } }, { new: true });
        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        } else {
            await Promise.all(deletePromises);
            res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating post', error });
    }
});

router.post('/chatinit', async (req, res) => {
    try {
        const { postId, postTopic, postUserId, postUsername, postUserImg, selfUserId, selfUsername, selfUserImg } = req.body;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found or removed!' });
        }
        const conversation = await Conversation.findOne({ $and: [{ postId }, { postUserId }, { selfUserId }] });
        if (conversation) {
            await Conversation.findByIdAndUpdate(conversation._id, { postTopic, postUsername, postUserImg, selfUsername, selfUserImg });
            res.status(200).json({ message: 'Conversation already exists', conversation: conversation });
        } else {
            const newConversation = new Conversation({ postId, postTopic, postUserId, postUsername, postUserImg, selfUserId, selfUsername, selfUserImg });
            await newConversation.save();
            res.status(201).json({ message: 'Conversation created successfully', conversation: newConversation });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error creating conversation', error });
    }
});

router.get('/getuser/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } else {
            res.status(200).json({ user });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
});

router.get('/getpost/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        } else {
            res.status(200).json({ post });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching post', error });
    }
});

router.post('/conversationmediaupload', upload.array('media'), async (req, res) => {
    try {
        const { userId, username } = req.body;
        let videoFiles = 0;
        const mediaPromises = (req.files as Express.Multer.File[]).map(async (file) => {
            const fileExtension = file.originalname.split('.').pop();
            if (['mp4', 'webm', 'avi', 'mov'].includes(fileExtension?.toLowerCase()!)){
                const tempDir = './temp';
                const convertedDir = tempDir + '/converted';
                fs.mkdirSync(tempDir, { recursive: true });
                fs.mkdirSync(convertedDir, { recursive: true });
                const inputFilePath = path.join(tempDir, file.originalname);
                fs.writeFileSync(inputFilePath, file.buffer);

                const outputFileName = `${file.originalname.replace(/\.[^.]+$/, '.mp4')}`;
                const outputFilePath = path.join(convertedDir, outputFileName);
                await new Promise((resolve, reject) => {
                    ffmpeg(inputFilePath)
                    .videoCodec('libx264')
                    .audioCodec('libmp3lame')
                    .audioBitrate('32k')
                    .format('mp4')
                    .size('50%')
                    .videoBitrate('250k')
                    .save(outputFilePath)
                    .on('error', function(err, stdout, stderr) {
                            console.log(err.message);
                            console.log("stdout:\n" + stdout);
                            console.log("stderr:\n" + stderr);
                            reject(new Error('Conversion failed'));
                        })
                    .on('end', resolve);
                });
                        
                const random = Math.floor(Math.random() * 1000000);
                const imgKey = `${userId}-${username}-${Date.now()}-${random}.${outputFileName.split('.').pop()}`;
                const imgLocation = `https://marketplace.tuanle.top/${imgKey}`;
                const params = {
                    Bucket: 'yotes-marketplace',
                    Key: imgKey,
                    Body: fs.createReadStream(outputFilePath),
                    ContentType: 'video/mp4',
                };
                const command = new PutObjectCommand(params);
                const data = await S3.send(command);
                videoFiles++;
                return { media: imgLocation };
            } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension?.toLowerCase()!)) {
                const random = Math.floor(Math.random() * 1000000);
                const imgKey = `${userId}-${username}-${Date.now()}-${random}.${file.originalname.split('.').pop()}`;
                const imgLocation = `https://marketplace.tuanle.top/${imgKey}`;
                const params = {
                    Bucket: 'yotes-marketplace',
                    Key: imgKey,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                };
                const command = new PutObjectCommand(params);
                const data = await S3.send(command);
                return { media: imgLocation };
            }
        });
        const media = await Promise.all(mediaPromises);
        if (videoFiles > 0) {
            const convertedDir = './temp/converted';
            const convertedFiles = await fs.readdirSync(convertedDir);
            for (const file of convertedFiles) {
                await fs.unlinkSync(`${convertedDir}/${file}`);
            }
            await fs.rmdirSync(convertedDir);
            const tempDir = './temp';
            const tempFiles = await fs.readdirSync(tempDir);
            for (const file of tempFiles) {
                await fs.unlinkSync(`${tempDir}/${file}`);
            }
            await fs.rmdirSync(tempDir);
        }
        res.status(201).json({ message: 'Media uploaded successfully', media });
    } catch (error) {
        res.status(500).json({ message: 'Media upload failed', error });
    }
});

import fs from 'fs';
import path from 'path';

router.post('/movtomp4', upload.array('media'), async (req, res) => {
    try {
        const { userId, username } = req.body;
        const mediaPromises = (req.files as Express.Multer.File[]).map(async (file) => {
            const tempDir = './temp';
            const convertedDir = tempDir + '/converted';
            fs.mkdirSync(tempDir, { recursive: true });
            fs.mkdirSync(convertedDir, { recursive: true });
            const inputFilePath = path.join(tempDir, file.originalname);
            fs.writeFileSync(inputFilePath, file.buffer);

            const outputFileName = `${file.originalname.replace(/\.[^.]+$/, '.mp4')}`;
            const outputFilePath = path.join(convertedDir, outputFileName);
            await new Promise((resolve, reject) => {
                ffmpeg(inputFilePath)
                   .videoCodec('libx264')
                   .audioCodec('libmp3lame')
                   .audioBitrate('32k')
                   .format('mp4')
                   .size('50%')
                   .videoBitrate('250k')
                   .save(outputFilePath)
                   .on('error', function(err, stdout, stderr) {
                        console.log(err.message);
                        console.log("stdout:\n" + stdout);
                        console.log("stderr:\n" + stderr);
                        reject(new Error('Conversion failed'));
                    })
                   .on('end', resolve);
            });
                    
            const random = Math.floor(Math.random() * 1000000);
            const imgKey = `${userId}-${username}-${Date.now()}-${random}.${outputFileName.split('.').pop()}`;
            const imgLocation = `https://marketplace.tuanle.top/${imgKey}`;
            const params = {
                Bucket: 'yotes-marketplace',
                Key: imgKey,
                Body: fs.createReadStream(outputFilePath),
                ContentType: 'video/mp4',
            };
            const command = new PutObjectCommand(params);
            const data = await S3.send(command);
            return { media: imgLocation };
        });
        const media = await Promise.all(mediaPromises);
        const convertedDir = './temp/converted';
        const convertedFiles = await fs.readdirSync(convertedDir);
        for (const file of convertedFiles) {
            await fs.unlinkSync(`${convertedDir}/${file}`);
        }
        await fs.rmdirSync(convertedDir);
        const tempDir = './temp';
        const tempFiles = await fs.readdirSync(tempDir);
        for (const file of tempFiles) {
            await fs.unlinkSync(`${tempDir}/${file}`);
        }
        await fs.rmdirSync(tempDir);
        res.status(201).json({ message: 'Media uploaded successfully', media });
    } catch (error) {
        res.status(500).json({ message: 'Media upload failed', error });
    }
});


router.post('/deletemedia', async (req, res) => {
    const { videoUrls } = req.body;
    try {
        const deletePromises = videoUrls.map((url) => {
            const key = url.split('/').pop();
            const deleteParams = {
                Bucket: 'yotes-marketplace',
                Key: key,
            };
            return S3.send(new DeleteObjectCommand(deleteParams));
        });
        await Promise.all(deletePromises);
        res.status(200).json({ message: 'Media deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting media', error });
    }
});
export default router;