
import 'dotenv/config';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for waiting orders with operators...');

  const count = await prisma.order.count({
    where: {
      status: 'waiting',
      operator_name: { not: null }
    }
  });

  console.log(`Found ${count} orders in "waiting" status that have an operator.`);

  if (count > 0) {
    console.log('🛠 Fixing orders...');
    const result = await prisma.order.updateMany({
      where: {
        status: 'waiting',
        operator_name: { not: null }
      },
      data: {
        operator_name: null,
        assigned_at: null
      }
    });
    console.log(`✅ Fixed ${result.count} orders.`);
  } else {
    console.log('✅ No orders need fixing.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
