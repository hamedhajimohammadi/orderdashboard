
import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function debugOrder() {
  const wpOrderId = 5052483;
  console.log(`Checking order with wp_order_id: ${wpOrderId}`);

  const order = await prisma.order.findUnique({
    where: { wp_order_id: wpOrderId }
  });

  if (!order) {
    console.log("Order not found by wp_order_id. Trying by id...");
    const orderById = await prisma.order.findUnique({
        where: { id: wpOrderId }
    });
    if(orderById) {
        console.log("Found by ID:", orderById);
    } else {
        console.log("Order not found by ID either.");
    }
  } else {
    console.log("Found Order:", order);
  }
}

debugOrder()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
