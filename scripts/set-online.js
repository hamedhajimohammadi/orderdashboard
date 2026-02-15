require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Setting User #1 to Online for demo...');
    // Only if conversation 1 exists
    const conv = await prisma.conversation.findFirst();
    if (conv && conv.user_id) {
        await prisma.user.update({
            where: { id: conv.user_id },
            data: { last_seen: new Date(), role: 'customer' }
        });
        console.log(`User ${conv.user_id} is now ONLINE.`);
    }
}
main().finally(() => prisma.$disconnect());
