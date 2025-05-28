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


module.exports = { createMessage, updateMessage, deleteMessage };