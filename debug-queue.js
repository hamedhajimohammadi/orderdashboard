
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getIranStartOfDay() {
  const now = new Date();
  // Iran is UTC+3:30
  const iranOffset = 3.5 * 60 * 60 * 1000;
  const iranTime = new Date(now.getTime() + iranOffset);
  
  // Reset to midnight
  iranTime.setUTCHours(0, 0, 0, 0);
  
  // Convert back to UTC
  return new Date(iranTime.getTime() - iranOffset);
}

async function main() {
  const startOfDay = getIranStartOfDay();
  const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);

  console.log("Start of Yesterday (UTC):", startOfYesterday.toISOString());

  const count = await prisma.order.count({
    where: { 
        order_date: { gte: startOfYesterday }
    }
  });

  console.log("Total Orders since Yesterday:", count);

  const orders = await prisma.order.findMany({
    where: { 
        order_date: { gte: startOfYesterday }
    },
    select: { id: true, wp_order_id: true, status: true, order_date: true },
    orderBy: { order_date: 'desc' },
    take: 20
  });

  console.log("Sample Orders:");
  orders.forEach(o => {
      console.log(`#${o.wp_order_id} [${o.status}] - ${o.order_date.toISOString()}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
