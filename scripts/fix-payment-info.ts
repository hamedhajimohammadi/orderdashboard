
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Use Merchant ID or API Token
const ZIBAL_MERCHANT = process.env.ZIBAL_MERCHANT || process.env.ZIBAL_API_TOKEN;

async function fixAllZibalOrders() {
    console.log("🚀 Starting Bulk Fix for Zibal Orders...");

    if (!ZIBAL_MERCHANT) {
        console.error("❌ Missing ZIBAL_MERCHANT or ZIBAL_API_TOKEN in .env");
        process.exit(1);
    }

    // Find orders that need fixing
    // Criteria: Payment method is Zibal AND card number is missing
    const orders = await prisma.order.findMany({
        where: {
            OR: [
                { payment_method: { contains: 'زیبال' } },
                { payment_gate_id: { contains: 'zibal', mode: 'insensitive' } }
            ],
            payment_card_number: null
        },
        select: {
            id: true,
            wp_order_id: true,
            snapshot_data: true
        },
        orderBy: { id: 'desc' },
        take: 100 // Process in batches of 100 to be safe
    });

    console.log(`Found ${orders.length} Zibal orders with missing card info.`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const order of orders) {
        const wpId = order.wp_order_id;
        const snapshot = order.snapshot_data as any;
        
        let trackId = null;

        // 1. Try to get trackId from snapshot first (fastest)
        if (snapshot) {
            if (snapshot.transaction_id) {
                trackId = snapshot.transaction_id;
            } else if (snapshot.meta_data && Array.isArray(snapshot.meta_data)) {
                const trackMeta = snapshot.meta_data.find((m: any) => 
                    m.key === 'transaction_id' || 
                    m.key === '_zibal_track_id' ||
                    m.key === 'wc_zibal_track_id'
                );
                if (trackMeta) trackId = trackMeta.value;
            }
        }

        // 2. If not in snapshot, maybe we need to fetch from WC? 
        // (Skipping for now to keep it fast, usually snapshot has it if synced)

        if (!trackId) {
            console.log(`   ⚠️ Order #${wpId}: No Track ID found in snapshot. Skipping.`);
            continue;
        }

        console.log(`Processing Order #${wpId} (Track ID: ${trackId})...`);

        try {
            const zibalRes = await axios.post('https://gateway.zibal.ir/v1/inquiry', {
                merchant: ZIBAL_MERCHANT,
                trackId: trackId
            });

            // Zibal returns 100 (success) or 201 (already verified) or 202 (failed?)
            // We just want the card number.
            if (zibalRes.data && zibalRes.data.cardNumber) {
                const card = zibalRes.data.cardNumber;
                console.log(`   ✅ Found Card: ${card}`);

                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        payment_card_number: card,
                        payment_method: 'zibal' // Normalize method name
                    }
                });
                updatedCount++;
            } else {
                console.log(`   ❌ Zibal Inquiry Failed or No Card: Result ${zibalRes.data.result} - ${zibalRes.data.message}`);
                failedCount++;
            }

        } catch (error: any) {
            console.error(`   ❌ API Error for #${wpId}:`, error.message);
            if (error.response) {
                 // console.error("      Response:", error.response.data);
                 if (error.response.data?.result === 105) {
                     console.error("      ⛔️ IP RESTRICTED. Run this on the server!");
                     process.exit(1); // Stop if IP is wrong
                 }
            }
            failedCount++;
        }
        
        // Small delay to be nice to Zibal API
        await new Promise(r => setTimeout(r, 200));
    }

    console.log("\n🎉 Done.");
    console.log(`Updated: ${updatedCount}`);
    console.log(`Failed: ${failedCount}`);
}

fixAllZibalOrders()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
