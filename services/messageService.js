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

module.exports = { createMessage };
