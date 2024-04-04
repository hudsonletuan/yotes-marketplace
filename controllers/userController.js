const User = require('../models/userModel');
const Post = require('../models/postModel');
const bcrypt = require('bcryptjs');

const getUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = await User.findOne({ $or : [{ username }, { email }] });
        if (!user) {
            return res.status(404).json({ message: 'Invalid username or password.' });
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid username or password.' });
        }

        req.session.username = user.username;

        const postList = await Post.find({ username: user.username });

        return res.status(200).json({ user, postList });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ username}, {email}] });
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ message: 'Username already exists' });
            } else {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        return res.status(201).json("User created successfully");
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { getUser, createUser };