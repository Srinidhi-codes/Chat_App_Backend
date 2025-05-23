const { Server } = require("socket.io");
const messagesResolver = require("./graphql/resolvers/messageResolver");
const { createMessage } = require('./services/messageService');

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.ORIGIN,
            credentials: true
        }
    });

    const userSocketMap = new Map();

    const disconnect = (socket) => {
        console.log(`Client disconnected: ${socket.id}`);
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                break;
            }
        }
    };

    const sendMessage = async (message) => {
        const senderSocketId = userSocketMap.get(message.sender);
        const recipientSocketId = userSocketMap.get(message.recipient);

        const input = {
            senderId: message.sender,
            recipientId: message.recipient,
            content: message.content,
            messageType: message.messageType,
            fileUrl: message.fileUrl ?? null,
        };

        try {
            const messageData = await createMessage(input);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("receiveMessage", messageData);
            }
            if (senderSocketId) {
                io.to(senderSocketId).emit("receiveMessage", messageData);
            }
        } catch (error) {
            console.error("Error sending message:", error.message);
        }
    };


    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`User connected with userId: ${userId} & socketId: ${socket.id}`);
        } else {
            console.log("User ID not provided during connection");
        }
        socket.on("sendMessage", sendMessage);
        socket.on("disconnect", () => disconnect(socket));
    });
};

module.exports = setupSocket;
