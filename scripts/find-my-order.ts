
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findMyOrder() {
  const targetChatId = 90462079;

  try {
    console.log(`🔍 Searching for user with Telegram Chat ID: ${targetChatId}...`);

    const user = await prisma.user.findFirst({
      where: {
        telegram_chat_id: BigInt(targetChatId)
      },
      include: {
        orders: {
          take: 5,
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (user) {
      console.log(`✅ User found: ${user.first_name} ${user.last_name} (${user.phone_number})`);
      if (user.orders.length > 0) {
        console.log(`📦 Found ${user.orders.length} orders for this user:`);
        user.orders.forEach(order => {
            console.log(`   - Order #${order.wp_order_id} (Status: ${order.status})`);
        });
        console.log(`\nUse Order #${user.orders[0].wp_order_id} for testing.`);
      } else {
        console.log('❌ This user has no orders.');
      }
    } else {
      console.log('❌ No user found with this Telegram Chat ID.');
      
      // Optional: Check if we can update a test user
      console.log('💡 Tip: You can manually update a test user in the database to have this Chat ID.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findMyOrder();
