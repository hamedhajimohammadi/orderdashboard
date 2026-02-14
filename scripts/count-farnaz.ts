
import { prisma } from '../lib/prisma';

async function countFarnazOrders() {
  const count = await prisma.order.count({
    where: {
      operator_name: 'farnaz'
    }
  });
  console.log(`Total orders for 'farnaz': ${count}`);
}

countFarnazOrders()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
