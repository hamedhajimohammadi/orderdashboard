
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestOrder() {
  const targetChatId = 90462079;

  try {
    const user = await prisma.user.findFirst({
      where: { telegram_chat_id: BigInt(targetChatId) }
    });

    if (!user) {
      console.log('❌ User not found. Cannot create order.');
      return;
    }

    console.log(`👤 Creating test order for user ID: ${user.id}`);

    // Generate a random fake WP Order ID to avoid conflicts
    const fakeWpOrderId = Math.floor(Math.random() * 1000000) + 9000000;

    const order = await prisma.order.create({
      data: {
        wp_order_id: BigInt(fakeWpOrderId),
        user_id: user.id,
        status: 'processing',
        wp_status: 'processing',
        total_amount_gross: 10000,
        final_payable: 10000,
        order_title: 'تست سیستم پیام‌رسان',
        order_date: new Date(),
        payment_method: 'Test Payment',
        snapshot_data: {
            billing: { first_name: 'Hamed', last_name: 'Test', phone: '09120000000' },
            line_items: [{ name: 'تست سیستم پیام‌رسان', quantity: 1 }]
        }
      }
    });

    console.log(`✅ Test Order Created!`);
    console.log(`- Internal ID: ${order.id}`);
    console.log(`- WP Order ID: ${order.wp_order_id}`);
    console.log(`\nNow you can go to the dashboard and find order #${order.wp_order_id} to test messaging.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();
