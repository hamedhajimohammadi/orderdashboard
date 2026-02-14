
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const order = await prisma.order.findUnique({
    where: { wp_order_id: 5052887 }
  });
  console.log(order);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
