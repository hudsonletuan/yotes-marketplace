import mongoose, { Document } from "mongoose";
import bcrypt from 'bcrypt';

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
        default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
    }
}, { timestamps: true });

userSchema.methods.comparePassword = function (candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUserDocument>('User', userSchema);