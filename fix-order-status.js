
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function fixOrder() {
  const orderId = 5052960;
  console.log(`Updating order #${orderId} to processing...`);

  const updated = await prisma.order.update({
    where: { wp_order_id: orderId },
    data: { 
      status: 'processing',
      wp_status: 'processing'
    }
  });

  console.log("Order updated:", updated);
}

fixOrder()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
