import { prisma } from '../lib/prisma';

async function main() {
  console.log('🔍 Checking for duplicate orders...');

  // 1. Find duplicates
  // Since Prisma doesn't support GROUP BY with HAVING count > 1 easily in findMany,
  // we'll use a raw query or fetch all and check.
  // Given the unique constraint, this should return nothing if the DB is healthy.
  
  const orders = await prisma.order.findMany({
    select: { id: true, wp_order_id: true, created_at: true }
  });

  const seen = new Map<string, number[]>();
  const duplicates: number[] = [];

  for (const order of orders) {
    const key = order.wp_order_id.toString();
    if (seen.has(key)) {
      const existingIds = seen.get(key)!;
      existingIds.push(order.id);
      duplicates.push(order.id); // Mark this one as duplicate (or we can be smarter about which one to keep)
    } else {
      seen.set(key, [order.id]);
    }
  }

  console.log(`📊 Total orders scanned: ${orders.length}`);
  console.log(`⚠️ Duplicates found: ${duplicates.length}`);

  if (duplicates.length > 0) {
    console.log('🧹 Removing duplicates...');
    
    // We want to keep the *latest* one usually, or the one with more data.
    // Here we just keep the first one we saw (which is arbitrary unless sorted).
    // Let's refine: Keep the one with the highest ID (usually newest).
    
    for (const [wpId, ids] of seen.entries()) {
      if (ids.length > 1) {
        // Sort by ID descending
        ids.sort((a, b) => b - a);
        const [keep, ...remove] = ids;
        
        console.log(`   - WP Order #${wpId}: Keeping ID ${keep}, Removing IDs ${remove.join(', ')}`);
        
        await prisma.order.deleteMany({
          where: {
            id: { in: remove }
          }
        });
      }
    }
    console.log('✅ Duplicates removed.');
  } else {
    console.log('✅ No duplicates found. The unique constraint is working.');
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
