
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizePhone(phone: string) {
  if (!phone) return "unknown";
  return phone.replace(/^0+|\s+|-/g, ''); 
}

export async function POST(req: Request) {
  try {
    // 1. Handle Webhook Ping (Creation Test)
    const textBody = await req.text();
    if (textBody.startsWith('webhook_id=')) {
        console.log("🔔 Webhook Ping Received");
        return NextResponse.json({ ok: true });
    }

    if (!textBody) return NextResponse.json({ error: 'Empty body' }, { status: 400 });

    const body = JSON.parse(textBody);
    const topic = req.headers.get('x-wc-webhook-topic');

    console.log(`🔔 Webhook Received: ${topic}`);

    if (topic === 'customer.updated' || topic === 'customer.created') {
        const customer = body;
        const billing = customer.billing || {};
        const rawPhone = billing.phone || customer.username || '0000000000';
        const phone = normalizePhone(rawPhone);

        if (phone && phone !== 'unknown' && phone.length >= 5) {
            // Check Verification
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

            // Update DB
            await prisma.user.upsert({
                where: { phone_number: phone },
                update: {
                    is_verified: isUserVerified,
                    first_name: customer.first_name || billing.first_name,
                    last_name: customer.last_name || billing.last_name,
                    // Sync Order Count directly from WC
                    orders_count: customer.orders_count || undefined,
                    total_spent: customer.total_spent ? parseFloat(customer.total_spent) : undefined
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
            console.log(`✅ Customer ${phone} updated. Verified: ${isUserVerified}, Orders: ${customer.orders_count}`);
        }
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: 'Topic ignored' });
  } catch (error: any) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
