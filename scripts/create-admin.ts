import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];
  const role = process.argv[4] || 'administrator';

  if (!username || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts <username> <password> [role]');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        admin_username: username,
        admin_password: hashedPassword,
        role: role,
        display_name: username,
        phone_number: `admin-${Date.now()}`, // Dummy phone number as it is unique and required
      },
    });

    console.log(`Admin user created: ${user.admin_username} (${user.role})`);
  } catch (e) {
    console.error('Error creating user:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
