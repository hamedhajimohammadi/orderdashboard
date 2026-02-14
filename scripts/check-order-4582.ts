
import { prisma } from '../lib/prisma';

async function checkOrder4582() {
  const order = await prisma.order.findUnique({
    where: { id: 4582 }
  });
  console.log('Order 4582 operator:', JSON.stringify(order?.operator_name));
}

checkOrder4582()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
