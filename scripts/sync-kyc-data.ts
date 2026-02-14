
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const WC_URL = process.env.WC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
const WC_CK = process.env.WC_CONSUMER_KEY;
const WC_CS = process.env.WC_CONSUMER_SECRET;

async function syncKycData() {
    console.log("🚀 Starting KYC Data Sync...");

    // Get users who have orders (prioritize them)
    const users = await prisma.user.findMany({
        where: { orders: { some: {} } },
        select: { id: true, phone_number: true }
    });

    console.log(`Found ${users.length} users with orders.`);

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        console.log(`Processing batch ${i + 1} to ${Math.min(i + batchSize, users.length)}...`);

        try {
            // We need to find the WC Customer ID first. 
            // Since we don't store WC ID in DB (yet), we have to search by phone.
            // This is slow one by one. 
            // Optimization: If we had WC ID it would be faster.
            // For now, let's just do it one by one for this critical batch.
            
            for (const user of batch) {
                try {
                    // Robust Search Logic
                    let targetCustomer = null;
                    const phone = String(user.phone_number).trim().replace(/\s+/g, '').replace(/-/g, '').replace(/^0+/, ''); // Normalize to 912...
                    const variations = [phone, '0' + phone, '+98' + phone, '0098' + phone];

                    for (const query of variations) {
                        try {
                            const searchRes = await axios.get(`${WC_URL}/wp-json/wc/v3/customers`, {
                                params: { 
                                    consumer_key: WC_CK, 
                                    consumer_secret: WC_CS,
                                    search: query,
                                    role: 'all'
                                }
                            });
                            if (searchRes.data && searchRes.data.length > 0) {
                                targetCustomer = searchRes.data[0];
                                break; // Found!
                            }
                        } catch (e) { /* ignore */ }
                    }

                    if (targetCustomer) {
                        // Extract KYC Data
                        const authMeta = targetCustomer.meta_data.find((m: any) => m.key === '_mnsfpt_user_authenticate');
                        
                        if (authMeta && authMeta.value) {
                            const data = typeof authMeta.value === 'string' ? JSON.parse(authMeta.value) : authMeta.value;
                            
                            // Map fields based on our discovery
                            // mnsfpt_field_1_1: Name
                            // mnsfpt_field_2_1: National Code
                            // mnsfpt_field_4_1: Bank Name
                            // mnsfpt_field_7_1: File
                            // mnsfpt_field_12_1: Card Number

                            const updateData = {
                                real_name: data.mnsfpt_field_1_1 || null,
                                national_code: data.mnsfpt_field_2_1 || null,
                                bank_name: data.mnsfpt_field_4_1 || null,
                                verification_file: data.mnsfpt_field_7_1 || null,
                                card_number: data.mnsfpt_field_12_1 || null,
                                is_verified: true // Assume verified if this data exists
                            };

                            await prisma.user.update({
                                where: { id: user.id },
                                data: updateData
                            });
                            
                            if (updateData.verification_file) {
                                console.log(`   ✅ Updated User #${user.id}: Found Verification File`);
                            } else {
                                console.log(`   ⚠️ Updated User #${user.id}: KYC data found but no file`);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`   ❌ Error processing user ${user.id}:`, err.message);
                }
            }

        } catch (error) {
            console.error("Batch Error:", error);
        }
    }
}

syncKycData()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
