import mongoose, { Document } from "mongoose";
import bcrypt from 'bcryptjs';

interface IUserDocument extends Document {
    username: string;
    email: string;
    password: string;
    img: string;
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
        default: 'https://yotes-marketplace.s3.us-east-2.amazonaws.com/yotes-logo.png'
    }
}, { timestamps: true });

userSchema.methods.comparePassword = function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUserDocument>('User', userSchema);