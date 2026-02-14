
import { prisma } from '../lib/prisma';

async function checkTodayOrders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log('Checking ALL orders completed since:', today);

  const orders = await prisma.order.findMany({
    where: {
      status: 'completed',
      completed_at: {
        gte: today
      }
    },
    select: {
      id: true,
      operator_name: true,
      completed_at: true
    }
  });

  console.log(`Found ${orders.length} orders:`);
  console.table(orders);
}

checkTodayOrders()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
