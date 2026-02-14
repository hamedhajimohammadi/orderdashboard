import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.order.count();
    console.log(`Total Orders in DB: ${count}`);

    const lastOrder = await prisma.order.findFirst({
      orderBy: { created_at: 'desc' }
    });
    console.log('Last Order:', lastOrder);
    
    const usersCount = await prisma.user.count();
    console.log(`Total Users: ${usersCount}`);

  } catch (error) {
    console.error('Error checking DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
