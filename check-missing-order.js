
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function checkOrder() {
  const orderId = 5052960;
  console.log(`Checking for order #${orderId}...`);

  const order = await prisma.order.findUnique({
    where: { wp_order_id: orderId }
  });

  if (order) {
    console.log("Order found in DB:", order);
  } else {
    console.log("Order NOT found in DB.");
  }
  
  // Also check recent orders to see if sync is working at all
  const recent = await prisma.order.findMany({
    take: 5,
    orderBy: { order_date: 'desc' }
  });
  console.log("Most recent 5 orders:", recent.map(o => ({ id: o.wp_order_id, date: o.order_date })));
}

checkOrder()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
