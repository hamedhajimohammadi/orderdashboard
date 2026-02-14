const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' }); // Load environment variables
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Successfully connected to the database!');
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
  } catch (e) {
    console.error('❌ Connection failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
