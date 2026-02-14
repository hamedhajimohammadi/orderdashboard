import { prisma } from '@/lib/prisma';
import axios from 'axios';
import { sendTelegramMessage } from '@/lib/telegram';

// --- Constants & Helpers ---

const AFFILIATE_CODES = ['adeltekno', 'se7en', 'hojat', 'fcmobo'];

function generateOrderTitle(lineItems: any[]): string {
    if (!lineItems || lineItems.length === 0) return 'سفارش نامشخص';
    const titles = lineItems.map((item: any) => {
        const qtyParams = item.quantity > 1 ? ` (x${item.quantity})` : '';
        return `${item.name}${qtyParams}`;
    });
    return titles.join(' + ');
}

// Helper to fetch Zibal Card Number
async function getZibalCard(order: any) {
  const merchantId = process.env.ZIBAL_MERCHANT || process.env.ZIBAL_API_TOKEN;
  if (!merchantId) return null;

  let trackId = order.transaction_id;
  if (!trackId && order.meta_data) {
      const t = order.meta_data.find((m: any) => m.key === 'transaction_id' || m.key === '_zibal_track_id' || m.key === 'wc_zibal_track_id');
      if (t) trackId = t.value;
  }

  if (trackId) {
      try {
          const res = await axios.post('https://gateway.zibal.ir/v1/inquiry', { merchant: merchantId, trackId });
          if (res.data && res.data.cardNumber) return res.data.cardNumber;
      } catch (e: any) { console.error("Zibal Webhook Error:", e.message); }
  }
  return null;
}

// Helper: Parse dates safely for Prisma
export function parseWooDate(dateString: string | null | undefined): Date {
    if (!dateString) return new Date(); // Fallback to now
    
    try {
        let cleanDate = dateString;
        if (cleanDate.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
            // Append Z if missing and looks like ISO
            cleanDate += 'Z';
        } else if (!cleanDate.endsWith('Z') && cleanDate.includes('T')) {
             // Basic ISO check
             cleanDate += 'Z';
        }
        
        const d = new Date(cleanDate);
        if (isNaN(d.getTime())) {
            console.error(`Invalid date parsed: ${dateString}, falling back to NOW`);
            return new Date();
        }
        return d;
    } catch (e) {
        console.error(`Date parsing exception for: ${dateString}`, e);
        return new Date();
    }
}

// Helper: Fetch verification status from external API
export async function getCustomerVerificationStatus(customerId: number, metaData: any[]): Promise<boolean> {
  // 1. Check metadata first (Cached results)
  if (metaData) {
      const verifiedMeta = metaData.find((m: any) => m.key === '_is_verified_customer');
      if (verifiedMeta && verifiedMeta.value === 'yes') return true;
  }
  // 2. Fallback
  return false;
}


// --- Main Sync Function ---

export async function syncOrderWithWooCommerce(order: any) {
    // ---------------------------------------------
    // ۱. شناسایی مشتری
    // ---------------------------------------------
    const billing = order.billing || {};
    const rawPhone = billing.phone || '';
    const normalizedPhone = rawPhone.replace(/^0+|\s+|-/g, ''); 
    
    let chatID = null;
    let username = null;
    if (order.meta_data) {
        const cMeta = order.meta_data.find((m: any) => m.key === '_telegram_chat_id');
        if (cMeta) chatID = cMeta.value;
        const uMeta = order.meta_data.find((m: any) => m.key === '_telegram_username');
        if (uMeta) username = uMeta.value;
    }

    // ---------------------------------------------
    // ۲. تحلیل تخفیف‌ها
    // ---------------------------------------------
    let discountType = 'none';
    let loyaltyAmount = 0;
    let loyaltyRedeemed = 0;
    
    if (order.fee_lines && Array.isArray(order.fee_lines)) {
        const pjsFee = order.fee_lines.find((f: any) => f.name.includes('کسر از اعتبار باشگاه') || f.name.includes('الماس'));
        if (pjsFee) {
            loyaltyAmount = Math.abs(parseFloat(pjsFee.total));
            discountType = 'loyalty_points';
        }
    }

    const redeemMeta = order.meta_data.find((m: any) => m.key === '_pjs_points_to_deduct' || m.key === '_pjs_points_reserved_amount');
    if (redeemMeta) loyaltyRedeemed = parseInt(redeemMeta.value);

    let loyaltyEarned = 0;
    const earnedMeta = order.meta_data.find((m: any) => m.key === '_pjs_earned_points');
    if (earnedMeta) loyaltyEarned = parseInt(earnedMeta.value);

    let affiliateCode = null;
    let affiliateAmount = 0;
    let couponCode = null;
    let couponAmount = 0;

    if (order.coupon_lines && order.coupon_lines.length > 0) {
        const coupon = order.coupon_lines[0];
        const code = coupon.code;
        const amount = parseFloat(coupon.discount);

        if (AFFILIATE_CODES.includes(code)) {
            affiliateCode = code;
            affiliateAmount = amount;
            discountType = (discountType === 'loyalty_points') ? 'mixed' : 'coupon_affiliate';
        } else {
            couponCode = code;
            couponAmount = amount;
            discountType = (discountType === 'loyalty_points') ? 'mixed' : 'coupon_general';
        }
    }

    // ---------------------------------------------
    // ۳. Database Operations
    // ---------------------------------------------
    
    // Upsert User
    const isVerified = await getCustomerVerificationStatus(order.customer_id, order.meta_data);
    let user = await prisma.user.findUnique({ where: { phone_number: normalizedPhone } });
    const wcId = order.customer_id;

    if (user) {
        const currentMeta = (user.metadata && typeof user.metadata === 'object') ? user.metadata : {};
        const newMeta = { ...currentMeta, wc_id: wcId };
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                first_name: billing.first_name,
                last_name: billing.last_name,
                is_verified: isVerified,
                ...(chatID && { telegram_chat_id: BigInt(chatID) }),
                ...(username && { telegram_username: username }),
                orders_count: { increment: 1 },
                total_spent: { increment: parseFloat(order.total) },
                last_order_date: new Date(),
                metadata: newMeta
            }
        });
    } else {
        user = await prisma.user.create({
            data: {
                phone_number: normalizedPhone,
                first_name: billing.first_name,
                last_name: billing.last_name,
                is_verified: isVerified,
                telegram_chat_id: chatID ? BigInt(chatID) : null,
                telegram_username: username,
                orders_count: 1,
                total_spent: parseFloat(order.total),
                last_order_date: new Date(),
                metadata: { wc_id: wcId }
            }
        });
    }

    const existingOrder = await prisma.order.findUnique({
        where: { wp_order_id: BigInt(order.id) }
    });

    // Status Mapping
    let newInternalStatus = 'pending';
    const incomingStatus = order.status;

    if (incomingStatus === 'ready-to-do' || incomingStatus === 'wc-ready-to-do') {
        newInternalStatus = 'waiting';
    } else if (incomingStatus === 'processing') {
        if (existingOrder && existingOrder.operator_name) {
            newInternalStatus = 'processing';
        } else {
            newInternalStatus = 'waiting'; // New processing orders go to waiting queue
        }
    } else if (incomingStatus === 'ersal-payam' || incomingStatus === 'wc-ersal-payam') {
        newInternalStatus = 'pending';
    } else if (incomingStatus === 'wrong-info' || incomingStatus === 'wc-wrong-info') {
        newInternalStatus = 'wrong-info';
    } else if (incomingStatus === 'need-verification' || incomingStatus === 'wc-need-verification') {
        newInternalStatus = 'need-verification';
    } else if (incomingStatus === 'waiting-refund' || incomingStatus === 'wc-waiting-refund') {
        newInternalStatus = 'refund-req';
    } else if (incomingStatus === 'refunded') {
        newInternalStatus = 'refunded';
    } else if (incomingStatus === 'completed') {
        newInternalStatus = 'completed';
    } else if (incomingStatus === 'cancelled') {
        newInternalStatus = 'cancelled';
    } else if (incomingStatus === 'failed') {
        newInternalStatus = 'failed';
    } else if (incomingStatus === 'on-hold') {
        newInternalStatus = 'on-hold';
    } else if (incomingStatus === 'pending') {
        newInternalStatus = 'pending';
    }

    if (existingOrder && existingOrder.status !== newInternalStatus) {
        console.log('[SYNC] Order', order.id, 'status change:', existingOrder.status, '→', newInternalStatus);
        const protectedStatuses = ['wrong-info', 'need-verification', 'refund-req', 'refunded', 'completed'];
        const incomingIsGeneric = ['processing', 'waiting', 'pending'].includes(newInternalStatus);
        if (protectedStatuses.includes(existingOrder.status) && incomingIsGeneric) {
            newInternalStatus = existingOrder.status;
        }
    }

    const zibalCardNumber = await getZibalCard(order);

    // Date Parsing - Critical Fix
    let finalOrderDate = parseWooDate(order.date_created_gmt || order.date_created);

    const result = await prisma.order.upsert({
        where: { wp_order_id: order.id },
        update: {
            status: newInternalStatus,
            wp_status: order.status,
            order_title: generateOrderTitle(order.line_items),
            final_payable: parseFloat(order.total),
            customer_note: order.customer_note,
            snapshot_data: order,
            payment_card_number: zibalCardNumber || existingOrder?.payment_card_number,
            order_date: finalOrderDate,
            updated_at: new Date()
        },
        create: {
            wp_order_id: order.id,
            user_id: user.id,
            order_title: generateOrderTitle(order.line_items),
            total_amount_gross: parseFloat(order.total) + loyaltyAmount + affiliateAmount + couponAmount,
            final_payable: parseFloat(order.total),
            payment_method: order.payment_method_title,
            payment_gate_id: order.payment_method,
            payment_card_number: zibalCardNumber,
            customer_note: order.customer_note,
            discount_type: discountType,
            affiliate_code: affiliateCode,
            affiliate_amount: affiliateAmount,
            coupon_code: couponCode,
            coupon_amount: couponAmount,
            loyalty_redeemed: loyaltyRedeemed,
            loyalty_amount: loyaltyAmount,
            loyalty_earned: loyaltyEarned,
            status: newInternalStatus, 
            wp_status: order.status,
            snapshot_data: order,
            order_date: finalOrderDate
        }
    });

    // Notify Telegram if new
    if (chatID && !existingOrder) {
        const message = `👋 سلام ${billing.first_name} عزیز،\n\n✅ سفارش شما با شماره <b>#${order.id}</b> دریافت شد.\n📦 محصول: ${generateOrderTitle(order.line_items)}\n\n⏳ همکاران ما به زودی سفارش شما را انجام خواهند داد.`;
        await sendTelegramMessage(chatID, message);
    }
    
    return result;
}
