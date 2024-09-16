import mongoose from 'mongoose';

const onlineUserSchema = new mongoose.Schema({
    username: String,
    room: String,
    joinedSince: {
        type: Date,
        default: Date.now
    }
});

export const onlineUserModel = mongoose.model('onlineUser', onlineUserSchema);
