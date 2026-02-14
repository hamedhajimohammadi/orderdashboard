
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

const prisma = new PrismaClient();

// --- تنظیمات API ---
const api = new WooCommerceRestApi({
  url: process.env.WC_SITE_URL || "https://pgemshop.com", 
  consumerKey: process.env.WC_CONSUMER_KEY!,
  consumerSecret: process.env.WC_CONSUMER_SECRET!,
  version: "wc/v3",
  axiosConfig: {
    headers: {
      "User-Agent": "OrderDashboard/1.0",
      "Content-Type": "application/json"
    }
  }
});

function normalizePhone(phone: string) {
  if (!phone) return "unknown";
  return phone.replace(/^0+|\s+|-/g, ''); 
}

async function syncAllUsers() {
  console.log("🚀 Starting Full User Sync Process...");
  
  let page = 1;
  const perPage = 50;
  let hasMore = true;
  let totalUpdated = 0;

  while (hasMore) {
    console.log(`\n📥 Fetching customers page ${page}...`);
    
    try {
      const response = await api.get("customers", {
        per_page: perPage,
        page: page,
        role: "all",
        context: "edit"
      });

      const customers = response.data;
      
      if (customers.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`🔄 Processing ${customers.length} users...`);

      await Promise.all(customers.map(async (customer: any) => {
        
        const billing = customer.billing || {};
        const rawPhone = billing.phone || customer.username || '0000000000';
        const phone = normalizePhone(rawPhone);
        
        if (phone === 'unknown' || phone.length < 5) return;

        // --- 🕵️‍♂️ منطق تشخیص احراز هویت ---
        let isUserVerified = false;
        const meta = customer.meta_data || [];
        
        const kycLevel1 = meta.find((m: any) => m.key === '_mnsfpt_user_level_status_mnsfpt_level_1');
        const kycAdvanced = meta.find((m: any) => m.key === '_mnsfpt_user_level_status_advanced');
        
        if (
            (kycLevel1 && kycLevel1.value === 'verified') || 
            (kycAdvanced && kycAdvanced.value === 'verified')
        ) {
            isUserVerified = true;
        }

        // آپدیت در دیتابیس
        try {
            await prisma.user.upsert({
                where: { phone_number: phone },
                update: {
                    is_verified: isUserVerified,
                    first_name: customer.first_name || billing.first_name,
                    last_name: customer.last_name || billing.last_name,
                },
                create: {
                    phone_number: phone,
                    first_name: customer.first_name || billing.first_name || "Guest",
                    last_name: customer.last_name || billing.last_name || "",
                    is_verified: isUserVerified,
                    orders_count: customer.orders_count || 0,
                    total_spent: parseFloat(customer.total_spent || '0'),
                }
            });
            if (isUserVerified) process.stdout.write('✅');
            else process.stdout.write('.');
            
            totalUpdated++;
        } catch (e) {
            // Ignore errors
        }
      }));

      console.log(`\n✅ Page ${page} synced.`);
      page++;
      
    } catch (error: any) {
      console.error("❌ Error fetching page:", error?.response?.data || error.message);
      hasMore = false; 
    }
  }

  console.log(`\n🏁 Sync finished! Total users processed: ${totalUpdated}`);
}

syncAllUsers()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
