import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const WC_URL = process.env.WC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
const WC_CK = process.env.WC_CONSUMER_KEY;
const WC_CS = process.env.WC_CONSUMER_SECRET;

if (!WC_URL || !WC_CK || !WC_CS) {
  console.error("❌ Missing WooCommerce env vars. Need WC_SITE_URL (or NEXT_PUBLIC_SITE_URL), WC_CONSUMER_KEY, WC_CONSUMER_SECRET");
  process.exit(1);
}

function normalizePhone(phone?: string | null) {
  if (!phone) return '';
  // remove spaces, dashes, leading zeros
  return String(phone).trim().replace(/\s+/g, '').replace(/-/g, '').replace(/^0+/, '');
}

async function findCustomerByPhone(phone: string) {
  // Generate variations
  const variations = new Set<string>();
  
  // 1. Normalized (no zero, no +98) -> e.g. 9123456789
  const core = normalizePhone(phone);
  if (core.length < 5) return null;

  variations.add(core);
  variations.add('0' + core);
  variations.add('+98' + core);
  variations.add('0098' + core);

  console.log(`   🔍 Searching WC for phone variations: ${Array.from(variations).join(', ')}`);

  for (const query of variations) {
    try {
      const res = await axios.get(`${WC_URL}/wp-json/wc/v3/customers`, {
        params: {
          consumer_key: WC_CK,
          consumer_secret: WC_CS,
          search: query,
          role: 'all',
        },
      });

      if (res.data && res.data.length > 0) {
        // Found something!
        // Return the first match that looks correct
        // (Optional: verify phone match strictly if needed, but search usually implies match)
        return res.data[0];
      }
    } catch (e) {
      // ignore error and try next variation
    }
  }

  return null;
}

async function getCompletedOrdersCount(customerId: number) {
  const res = await axios.get(`${WC_URL}/wp-json/wc/v3/orders`, {
    params: {
      consumer_key: WC_CK,
      consumer_secret: WC_CS,
      customer: customerId,
      status: 'completed',
      per_page: 1,
      page: 1,
    },
  });

  // Woo sends total count in this header
  const totalHeader = res.headers?.['x-wp-total'];
  const total = parseInt(totalHeader ?? '0', 10);
  return Number.isFinite(total) ? total : 0;
}

async function syncAllUsersStats() {
  console.log("🚀 Starting Sync of Users' Stats (completed orders + total_spent) ...");

  const users = await prisma.user.findMany({
  where: {
    OR: [
      { metadata: { equals: null } },
      { metadata: { path: ['wc_id'], equals: null } },
    ],
  },
  select: { id: true, phone_number: true, display_name: true, metadata: true },
});


  console.log(`Found ${users.length} users in DB.`);

  let updated = 0;
  let notFound = 0;
  let failed = 0;

  // ساده و امن: یکی یکی (فشار کمتر روی WC و DB)
  for (const user of users) {
    const phone = normalizePhone(user.phone_number);
    const label = user.display_name || user.phone_number || `#${user.id}`;

    if (!phone || phone.length < 5) {
      console.log(`\n⚠️ Skipping User #${user.id} (${label}) - invalid phone`);
      continue;
    }

    console.log(`\nProcessing User #${user.id} (${label})...`);

    try {
      const customer = await findCustomerByPhone(phone);

      if (!customer) {
        console.log("   ⚠️ Customer not found in WooCommerce.");
        notFound++;
        continue;
      }

      const wcId = customer.id;
      const totalSpentRaw = customer.total_spent ?? '0';
      const totalSpent = parseFloat(String(totalSpentRaw)) || 0;

      console.log(`   ✅ Found WC Customer ID: ${wcId}`);
      console.log(`   WC total_spent: ${totalSpent}`);

      const completedCount = await getCompletedOrdersCount(wcId);
      console.log(`   ✅ Completed Orders Count: ${completedCount}`);

      // Merge metadata
      const currentMeta = (user.metadata && typeof user.metadata === 'object') ? user.metadata : {};
      const newMeta = { ...currentMeta, wc_id: wcId };

      await prisma.user.update({
        where: { id: user.id },
        data: {
          orders_count: completedCount,
          total_spent: totalSpent,
          metadata: newMeta,
        },
      });

      console.log("   ✅ DB Updated (orders_count, total_spent, wc_id).");
      updated++;
    } catch (err: any) {
      console.error(`   ❌ Error syncing user ${user.id}:`, err?.message || err);
      failed++;
    }
  }

  console.log("\n🎉 Sync Complete.");
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️ Not Found in WC: ${notFound}`);
  console.log(`❌ Failed: ${failed}`);
}

syncAllUsersStats()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });