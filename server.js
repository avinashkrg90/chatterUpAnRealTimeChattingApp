// don't change the prewritten code
// change the code for 'join' event

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { messageModel } from './message.schema.js';
import { onlineUserModel } from './onlineUsers.js';

export const app = express();
app.use(cors());

export const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("Connection made.");

    socket.on("join", async (data) => {

        socket.emit("notification", { text: `Welcome, ${data.username}!` });

        // Broadcast a message to all other users in the same room
        socket.broadcast.to(data.room).emit("notification", {
            text: `${data.username} has joined the room.`
        });

        // Join the room
        socket.join(data.room);
        // write your code here

        socket.username = data.username;
        //send old messages to the client
        
        const newUser = new onlineUserModel({
            username:data.username,
            room:data.room,
        })
        await newUser.save();
        const onlineUsersInRoom = await onlineUserModel.find({room:data.room});
        // console.log(onlineUsersInRoom);
        io.to(data.room).emit("listOfOnlineUsers", onlineUsersInRoom);

        try {
            const oldMessages = await messageModel.find().sort({ timestamp: 1 }).limit(50);
            // console.log(messages);
            socket.emit('previousMessages', oldMessages)
        } catch (err) {
            console.log(err)
        }

        // console.log(data.file)
    });

    socket.on("sendMsg", async ({ msg, room }) => {

        const message = new messageModel({
            username: socket.username,
            text: msg,
            room: room
        })

        await message.save();
        // console.log(message)
        // Broadcast the received message to all users in the same room
        socket.to(room).emit("message", message);
    });

    socket.on("disconnect", async () => {
        const leavedUser = await onlineUserModel.findOne({username:socket.username});
        console.log(leavedUser)
        let room = '';
        if (leavedUser)
            room = leavedUser.room;
        console.log(room)
        await onlineUserModel.findOneAndDelete({username:socket.username});
        const onlineUsersInRoom = await onlineUserModel.find({room});
        console.log(onlineUsersInRoom);
        io.to(room).emit("listOfOnlineUsers", onlineUsersInRoom);
        console.log("Connection disconnected.");
    });
});


