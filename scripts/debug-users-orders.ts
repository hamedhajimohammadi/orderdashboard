
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("--- Checking Users ---");
  const users = await prisma.user.findMany();
  console.table(users.map(u => ({ id: u.id, username: u.admin_username, display: u.display_name })));

  console.log("\n--- Checking Specific Orders ---");
  const orderIds = [5052523, 5052480, 5052408, 5052363, 5052475];
  
  const orders = await prisma.order.findMany({
    where: {
      wp_order_id: { in: orderIds.map(id => BigInt(id)) }
    }
  });

  console.table(orders.map(o => ({ 
    id: o.id, 
    wp_id: o.wp_order_id.toString(), 
    status: o.status, 
    operator: o.operator_name 
  })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
