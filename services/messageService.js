// services/messageService.js
const prisma = require('../config/database');

async function createMessage(input) {
    const createdMessage = await prisma.messages.create({
        data: input,
    });

    const messageData = await prisma.messages.findUnique({
        where: { id: createdMessage.id },
        include: {
            sender: {
                select: { id: true, email: true, firstName: true, lastName: true, image: true, color: true }
            },
            recipient: {
                select: { id: true, email: true, firstName: true, lastName: true, image: true, color: true }
            }
        }
    });

    return messageData;
}

async function updateMessage(input) {
    const { id, content, edited } = input;
    const updatedMsg = await prisma.messages.update({
        where: { id },
        data: {
            content,
            edited,
        },

    });
    return { ...updatedMsg };
}

async function deleteMessage(id) {
    const deletedMsg = await prisma.messages.delete({
        where: { id },
    });
    return { ...deletedMsg };
}

async function toggleReaction({ messageId, userId, type }) {
    // Check if user already reacted to this message
    const existingReaction = await prisma.reaction.findUnique({
        where: {
            messageId_userId: { messageId, userId },
        },
    });

    if (existingReaction) {
        if (existingReaction.type === type) {
            // Toggle off (same type)
            await prisma.reaction.delete({
                where: { id: existingReaction.id },
            });
            return { toggledOff: true, reaction: existingReaction };
        } else {
            // Replace existing reaction with new type
            await prisma.reaction.delete({
                where: { id: existingReaction.id },
            });
            const newReaction = await prisma.reaction.create({
                data: { messageId, userId, type },
            });
            return { toggledOff: false, reaction: newReaction };
        }
    } else {
        // No existing reaction — create new one
        const newReaction = await prisma.reaction.create({
            data: { messageId, userId, type },
        });
        return { toggledOff: false, reaction: newReaction };
    }
}



async function addOrUpdateReaction(input) {
    const result = await toggleReaction(input);

    // Fetch updated message with reactions
    const messageWithReactions = await prisma.messages.findUnique({
        where: { id: input.messageId },
        include: {
            reaction: true,
            sender: true,
            recipient: true,
        },
    });

    return {
        ...result.reaction,
        toggledOff: result.toggledOff,
        senderId: messageWithReactions?.senderId,
        recipientId: messageWithReactions?.recipientId,
        reactions: messageWithReactions?.reaction ?? [],
    };
}



module.exports = { createMessage, updateMessage, deleteMessage, addOrUpdateReaction };