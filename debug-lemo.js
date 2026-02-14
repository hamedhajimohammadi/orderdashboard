
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { 
        status: 'completed',
        operator_name: 'lemo'
    },
    orderBy: { completed_at: 'desc' },
    take: 5,
    select: { id: true, wp_order_id: true, completed_at: true }
  });
  
  console.log("Last 5 Orders for lemo:");
  orders.forEach(o => {
    const comp = o.completed_at ? o.completed_at.toISOString() : "NULL";
    console.log(`#${o.wp_order_id}: ${comp}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
