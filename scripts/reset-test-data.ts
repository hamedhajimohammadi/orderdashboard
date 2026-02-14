import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Starting Test Data Reset...');

  // 1. Reset Orders (Release all orders back to queue)
  // We only reset orders that are currently assigned or completed in the test phase
  const updateResult = await prisma.order.updateMany({
    where: {
        // You might want to filter only specific statuses if you want to keep some history,
        // but for a full test reset:
        OR: [
            { status: 'processing' },
            { status: 'completed' },
            { status: 'wrong-info' },
            { status: 'need-verification' }
        ]
    },
    data: {
      status: 'pending',
      operator_name: null,
      assigned_at: null,
      completed_at: null,
    }
  });
  console.log(`✅ ${updateResult.count} orders reset to 'pending' and released from admins.`);

  // 2. Clear Order Logs
  const deleteLogs = await prisma.orderLog.deleteMany({});
  console.log(`✅ ${deleteLogs.count} order logs deleted.`);

  // 3. Reset User Daily Stats
  const updateUser = await prisma.user.updateMany({
    data: {
      worked_seconds_today: 0,
      // We don't change is_online so they don't get kicked out immediately, 
      // but their timers will reset.
    }
  });
  console.log(`✅ Daily stats reset for ${updateUser.count} users.`);

  console.log('🚀 System is ready for fresh testing!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
