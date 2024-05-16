import mongoose, { Document } from "mongoose";
import bcrypt from 'bcryptjs';

interface IUserDocument extends Document {
    username: string;
    email: string;
    password: string;
    img: string;
    userStatus: string;
    lastActive: Date;
    socketId: string | null;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        lowercase: true,
        trim: true,
        minLength: 3
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        minLength: 3
    },
    password: {
        type: String,
        trim: true,
        minLength: 6
    },
    img: {
        type: String,
        default: 'https://marketplace.tuanle.top/yotes-logo.png'
    },
    userStatus: {
        type: String,
    },
    lastActive: {
        type: Date,
    },
    socketId: {
        type: String,
        default: null
    },
}, { timestamps: true });

userSchema.methods.comparePassword = function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUserDocument>('User', userSchema);