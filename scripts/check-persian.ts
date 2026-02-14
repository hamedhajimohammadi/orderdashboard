
import { prisma } from '../lib/prisma';

async function checkPersianFarnaz() {
  const orders = await prisma.order.findMany({
    where: {
      operator_name: 'فرناز',
    }
  });
  console.log(`Found ${orders.length} orders for 'فرناز'`);
}

checkPersianFarnaz()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
