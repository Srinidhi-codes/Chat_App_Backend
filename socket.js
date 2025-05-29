const { Server } = require("socket.io");
const { createMessage, updateMessage, deleteMessage, addOrUpdateReaction } = require("./services/messageService");

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.ORIGIN,
            credentials: true
        }
    });

    // userId -> socketId
    const userSocketMap = new Map();

    const disconnect = (socket) => {
        // console.log(`Client disconnected: ${socket.id}`);
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);

                // Notify everyone that this user went offline
                io.emit("userOffline", userId);
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

            // Send message to both sender and recipient if online
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

    const editMessage = async (editPayload) => {
        try {
            const updatedMessage = await updateMessage(editPayload);
            const senderSocketId = userSocketMap.get(updatedMessage.senderId);
            const recipientSocketId = userSocketMap.get(updatedMessage.recipientId);

            if (senderSocketId) {
                io.to(senderSocketId).emit("messageEdited", updatedMessage);
            }
            if (recipientSocketId && recipientSocketId !== senderSocketId) {
                io.to(recipientSocketId).emit("messageEdited", updatedMessage);
            }
        } catch (error) {
            console.error("Error editing message:", error.message);
        }
    };

    const deleteMessageSocket = async (deletePayload) => {
        try {
            const deletedMessage = await deleteMessage(deletePayload.id);
            const senderSocketId = userSocketMap.get(deletedMessage.senderId);
            const recipientSocketId = userSocketMap.get(deletedMessage.recipientId);

            if (senderSocketId) {
                io.to(senderSocketId).emit("messageDeleted", deletedMessage);
            }
            if (recipientSocketId && recipientSocketId !== senderSocketId) {
                io.to(recipientSocketId).emit("messageDeleted", deletedMessage);
            }
        } catch (error) {
            console.error("Error deleteing message:", error.message);
        }
    };

    const addOrUpdateReactionSocket = async (payload) => {
        try {
            // Map emoji to type
            const reactionPayload = {
                messageId: payload.messageId,
                userId: payload.userId,
                type: payload.type,
            };

            const reactionData = await addOrUpdateReaction(reactionPayload);

            const { senderId, recipientId } = reactionData;

            const senderSocketId = userSocketMap.get(senderId);
            const recipientSocketId = userSocketMap.get(recipientId);

            if (senderSocketId) {
                io.to(senderSocketId).emit("messageReactionUpdated", reactionData);
            }
            if (recipientSocketId && recipientSocketId !== senderSocketId) {
                io.to(recipientSocketId).emit("messageReactionUpdated", reactionData);
            }
        } catch (error) {
            console.error("Error adding/updating reaction message:", error.message);
            return [];
        }
    };

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            userSocketMap.set(userId, socket.id);
            console.log(`User connected with userId: ${userId} & socketId: ${socket.id}`);

            // Notify all clients that this user is online
            io.emit("userOnline", userId);

            // Send current online users to the newly connected user
            const onlineUsers = Array.from(userSocketMap.keys());
            socket.emit("onlineUsers", onlineUsers);
        }
        //  else {
        //     console.log("User ID not provided during connection");
        // }

        socket.on("sendMessage", sendMessage);
        socket.on("editMessage", editMessage);
        socket.on("deleteMessage", deleteMessageSocket);
        socket.on("reactToMessage", addOrUpdateReactionSocket);

        socket.on("disconnect", () => disconnect(socket));
    });
};

module.exports = setupSocket;
