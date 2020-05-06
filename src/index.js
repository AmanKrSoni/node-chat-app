const express = require("express");
const path = require("path");
const http = require("http");
const socket = require("socket.io");
const { generateMessage } = require("./utils/messages.js");
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
    getAllUser,
} = require("./utils/users");

const Filter = require("bad-words");
const filter = new Filter();

const app = express();
const server = http.createServer(app);
const io = socket(server);

const port = process.env.PORT || 3000;
const publicDirectory = path.join(__dirname, "../public");

app.use(express.static(publicDirectory));
let message = "welcome";

io.on("connection", (socket) => {
    console.log(`connection is established`);

    // io.to.emit, socket.broadcast.to.emit
    socket.on("join", ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            console.log(error);
            return callback(error);
        }
        socket.join(user.room);
        socket.emit("message", generateMessage("Chatie", "welcome!"));

        socket.broadcast
            .to(user.room)
            .emit(
                "message",
                generateMessage(`Chatie`, `${user.username} has joined! `)
            );
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room),
        });

        callback();
    });

    socket.on("sendMessage", (message, ackCallBack) => {
        const user = getUser(socket.id);
        console.log("message : ", user);
        console.log(getAllUser());

        if (user) {
            io.to(user.room).emit("message", generateMessage(user.username, message));
            ackCallBack(undefined, "");
        } else {
            ackCallBack(`user not found with id : ${socket.id}`, undefined);
        }
    });

    socket.on("sendLocation", (location, ackCallBack) => {
        const user = getUser(socket.id);
        console.log("location : ", user);
        console.log(getAllUser());

        console.log(location);
        if (user) {
            io.to(user.room).emit(
                "locationMessage",
                generateMessage(
                    user.username,
                    `https://google.com/maps?q=${location.latitude},${location.longitude}`
                )
            );
            ackCallBack(undefined, "");
        } else {
            ackCallBack(
                `ERROR while sending location : user not found with id : ${socket.id}`,
                undefined
            );
        }
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit(
                "message",
                generateMessage(`Chatie`, `${user.username} has left!`)
            );

            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room),
            });
        }
    });
});

server.listen(3000, () => {
    console.log(`server is started on port : ${port}`);
});