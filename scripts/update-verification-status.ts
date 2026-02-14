
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const WC_URL = process.env.WC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
const WC_CK = process.env.WC_CONSUMER_KEY;
const WC_CS = process.env.WC_CONSUMER_SECRET;

async function getCustomerVerificationStatus(customerId: number, orderMeta: any[] = []): Promise<boolean> {
    // 1. Check Order Meta first
    if (orderMeta && orderMeta.length > 0) {
        const inOrder = orderMeta.some((m: any) => 
            (m.key === '_mnsfpt_user_level_status_mnsfpt_level_1' && m.value === 'verified') ||
            (m.key === '_mnsfpt_user_level_status_advanced' && m.value === 'verified')
        );
        if (inOrder) return true;
    }

    if (!customerId) return false;
    try {
        const res = await axios.get(`${WC_URL}/wp-json/wc/v3/customers/${customerId}`, {
            params: { consumer_key: WC_CK, consumer_secret: WC_CS, context: 'edit' },
            timeout: 10000
        });
        
        const customer = res.data;
        if (!customer || !customer.meta_data) return false;

        return customer.meta_data.some((m: any) => 
            (m.key === '_mnsfpt_user_level_status_mnsfpt_level_1' && m.value === 'verified') ||
            (m.key === '_mnsfpt_user_level_status_advanced' && m.value === 'verified')
        );
    } catch (error) {
        console.error(`   ❌ Error fetching customer ${customerId}:`, error instanceof Error ? error.message : error);
        return false;
    }
}

async function main() {
    console.log("🚀 Starting Verification Status Update...");
    
    // 1. Get all users who have orders (or all users)
    // We can iterate through orders to find customer IDs, or if we stored customer_id in User model (we didn't, we use phone/email).
    // Wait, User model doesn't have WC Customer ID!
    // But Order model has `wp_order_id`. We can fetch order from WC to get customer ID? No, too slow.
    
    // We need to find a way to link User to WC Customer ID.
    // In `import-orders.ts`, we mapped `customer_id` from order to `is_verified`.
    // But we didn't store `customer_id` in `User` table.
    
    // So we have to iterate through ORDERS in our DB, fetch the order from WC (or if we have it in snapshot), get customer_id, then check verification.
    // This is heavy.
    
    // Alternative: Iterate through recent orders in DB.
    const orders = await prisma.order.findMany({
        where: {
            status: { in: ['processing', 'pending', 'waiting'] } // Only active orders for now
        },
        include: { user: true },
        orderBy: { created_at: 'desc' },
        take: 100
    });

    console.log(`Found ${orders.length} active orders to check.`);

    for (const order of orders) {
        if (!order.wp_order_id) continue;
        
        console.log(`Checking Order #${order.wp_order_id}...`);
        
        try {
            // Fetch order from WC to get customer_id
            const wcOrderRes = await axios.get(`${WC_URL}/wp-json/wc/v3/orders/${order.wp_order_id}`, {
                params: { consumer_key: WC_CK, consumer_secret: WC_CS }
            });
            const wcOrder = wcOrderRes.data;
            const customerId = wcOrder.customer_id;
            
            if (customerId) {
                const isVerified = await getCustomerVerificationStatus(customerId, wcOrder.meta_data);
                console.log(`   User ${order.user.phone_number} (Customer ${customerId}) -> Verified: ${isVerified}`);
                
                if (order.user_id) {
                    await prisma.user.update({
                        where: { id: order.user_id },
                        data: { is_verified: isVerified }
                    });
                }
            }
        } catch (e) {
            console.error(`Failed to process order ${order.wp_order_id}:`, e.message);
        }
    }
    
    console.log("✅ Done.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
