const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    where: { status: 'completed' },
    orderBy: { updated_at: 'desc' },
    take: 10,
    select: { id: true, wp_order_id: true, completed_at: true, operator_name: true }
  });
  
  console.log("Last 10 Completed Orders:");
  orders.forEach(o => {
    const comp = o.completed_at ? o.completed_at.toISOString() : "NULL";
    console.log(`#${o.wp_order_id} by ${o.operator_name}: ${comp}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
