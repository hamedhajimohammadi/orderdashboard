import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'زیرساخت و سرور', description: 'هزینه‌های مربوط به سرور، دامنه و ابزارهای فنی' },
    { name: 'حقوق و دستمزد', description: 'حقوق کارمندان و پاداش‌ها' },
    { name: 'تبلیغات و مارکتینگ', description: 'هزینه‌های تبلیغات گوگل، اینستاگرام و ...' },
    { name: 'اجاره و دفتر', description: 'اجاره دفتر و هزینه‌های جاری ساختمان' },
    { name: 'سرویس‌های پیامک', description: 'هزینه‌های پنل پیامک' },
    { name: 'سایر', description: 'هزینه‌های متفرقه' },
  ];

  for (const cat of categories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('✅ Expense Categories seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
