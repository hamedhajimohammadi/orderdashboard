
import { prisma } from '../lib/prisma';

async function checkCaseVariations() {
  const orders = await prisma.order.findMany({
    where: {
      operator_name: {
        contains: 'farnaz',
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      operator_name: true
    }
  });
  console.log(`Found ${orders.length} orders with case-insensitive 'farnaz':`);
  console.table(orders);
}

checkCaseVariations()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
