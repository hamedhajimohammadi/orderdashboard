
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findTestOrder() {
  try {
    // پیدا کردن کاربری که چت آیدی دارد
    const userWithChatId = await prisma.user.findFirst({
      where: {
        telegram_chat_id: { not: null }
      },
      include: {
        orders: {
          take: 1,
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (userWithChatId && userWithChatId.orders.length > 0) {
      const order = userWithChatId.orders[0];
      console.log('\n✅ سفارش مناسب برای تست پیدا شد:');
      console.log(`- Order ID (Internal): ${order.id}`);
      console.log(`- WP Order ID: ${order.wp_order_id}`);
      console.log(`- Customer: ${userWithChatId.first_name} ${userWithChatId.last_name}`);
      console.log(`- Phone: ${userWithChatId.phone_number}`);
      console.log(`- Telegram Chat ID: ${userWithChatId.telegram_chat_id}`);
      console.log(`\nمی‌توانید از سفارش #${order.wp_order_id} برای تست ارسال پیام استفاده کنید.`);
    } else {
      console.log('\n❌ هیچ کاربری با چت آیدی تلگرام که سفارش داشته باشد پیدا نشد.');
      console.log('پیشنهاد: یک سفارش جدید با وب‌هوک شبیه‌سازی کنید که حاوی متادیتای تلگرام باشد.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findTestOrder();
