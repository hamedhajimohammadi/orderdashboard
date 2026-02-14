import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Delete all expenses (it said 1 row exists)
    // This unblocks the "required column" error
    await prisma.expense.deleteMany();
    console.log('✅ Cleared Expense table.');

  } catch (error) {
    console.error('Error clearing expenses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
