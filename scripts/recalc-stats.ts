import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

// --- تنظیمات اولیه ---
const prisma = new PrismaClient();

// بررسی مقادیر حیاتی
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl || !siteUrl.startsWith('http')) {
  console.error('❌ خطای مهم: آدرس سایت در فایل .env تنظیم نشده است.');
  process.exit(1);
}

const WC_CK = process.env.WC_CONSUMER_KEY!;
const WC_CS = process.env.WC_CONSUMER_SECRET!;
const WC_URL = siteUrl.replace(/\/$/, ""); 
const AFFILIATE_CODES = ['adeltekno', 'se7en', 'hojat', 'fcmobo'];

// --- توابع کمکی ---

function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/^0+|\s+|-/g, ''); 
}

function generateOrderTitle(lineItems: any[]): string {
  if (!lineItems || lineItems.length === 0) return 'سفارش نامشخص';
  const titles = lineItems.map(item => {
    const qtyParams = item.quantity > 1 ? ` (x${item.quantity})` : '';
    return `${item.name}${qtyParams}`;
  });
  return titles.join(' + ');
}

// --- فاز ۱: دانلود و ذخیره دیتا ---

async function fetchAndImportOrders() {
  console.log('=============================================');
  console.log('🚀 فاز ۱: شروع استخراج کامل داده‌ها (Data Mining)');
  console.log('=============================================');
  
  let page = 1;
  let hasNextPage = true;
  let totalImported = 0;

  while (hasNextPage) {
    try {
      console.log(`📥 در حال دریافت صفحه ${page}...`);
      
      const response = await axios.get(`${WC_URL}/wp-json/wc/v3/orders`, {
        params: {
          consumer_key: WC_CK,
          consumer_secret: WC_CS,
          per_page: 20, 
          page: page,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 40000 
      });

      const orders = response.data;

      if (orders.length === 0) {
        hasNextPage = false;
        console.log('✅ تمام سفارش‌ها از سایت دریافت شد.');
        break;
      }

      console.log(`💾 ذخیره ${orders.length} سفارش در دیتابیس...`);

      for (const order of orders) {
        const billing = order.billing || {};
        const rawPhone = billing.phone || '';
        const normalizedPhone = normalizePhoneNumber(rawPhone);

        if (!normalizedPhone) continue;

        // استخراج اطلاعات تلگرام و مارکتینگ از متادیتا
        let chatID = null;
        let username = null;
        if (order.meta_data) {
            const cMeta = order.meta_data.find((m: any) => m.key === '_telegram_chat_id');
            if (cMeta) chatID = cMeta.value;
            const uMeta = order.meta_data.find((m: any) => m.key === '_telegram_username');
            if (uMeta) username = uMeta.value;
        }

        // ایجاد مشتری (فعلا بدون محاسبه مالی، چون در فاز ۲ دقیق حساب می‌کنیم)
        const user = await prisma.user.upsert({
            where: { phone_number: normalizedPhone },
            update: {
                first_name: billing.first_name,
                last_name: billing.last_name,
                ...(chatID && { telegram_chat_id: BigInt(chatID) }),
                ...(username && { telegram_username: username }),
            },
            create: {
                phone_number: normalizedPhone,
                first_name: billing.first_name,
                last_name: billing.last_name,
                telegram_chat_id: chatID ? BigInt(chatID) : null,
                telegram_username: username,
                orders_count: 0, 
                total_spent: 0,
            }
        });

        // تحلیل مالی برای سفارش
        let discountType = 'none';
        let loyaltyAmount = 0;
        let loyaltyRedeemed = 0;
        
        if (order.fee_lines && Array.isArray(order.fee_lines)) {
            const pjsFee = order.fee_lines.find((f: any) => f.name.includes('کسر از اعتبار') || f.name.includes('الماس'));
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

        const totalPayable = parseFloat(order.total);
        const totalGross = totalPayable + loyaltyAmount + affiliateAmount + couponAmount;

        // ذخیره سفارش با تمام جزئیات (Snapshot کامل)
        await prisma.order.upsert({
            where: { wp_order_id: BigInt(order.id) },
            update: {
                status: order.status,
                wp_status: order.status,
                final_payable: totalPayable,
                total_amount_gross: totalGross,
                order_title: generateOrderTitle(order.line_items),
                snapshot_data: order, // آپدیت اسنپ‌شات برای تغییرات احتمالی
            },
            create: {
                wp_order_id: BigInt(order.id),
                user_id: user.id,
                total_amount_gross: totalGross,
                final_payable: totalPayable,
                payment_method: order.payment_method_title,
                payment_gate_id: order.payment_method,
                customer_note: order.customer_note,
                discount_type: discountType,
                affiliate_code: affiliateCode,
                affiliate_amount: affiliateAmount,
                coupon_code: couponCode,
                coupon_amount: couponAmount,
                loyalty_redeemed: loyaltyRedeemed,
                loyalty_amount: loyaltyAmount,
                loyalty_earned: loyaltyEarned,
                status: order.status === 'completed' ? 'completed' : 'pending',
                wp_status: order.status,
                snapshot_data: order, // کل دیتای خام برای آینده
                order_title: generateOrderTitle(order.line_items),
                order_date: new Date(order.date_created),
                created_at: new Date(order.date_created)
            }
        });
        
        totalImported++;
      }

      console.log(`✅ صفحه ${page} کامل شد.`);
      page++;

    } catch (error: any) {
      console.error('❌ خطا در دریافت:');
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
      } else {
        console.error(error.message);
      }
      console.log('⏳ تلاش مجدد در ۵ ثانیه...');
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  console.log(`🏁 فاز ۱ تمام شد. مجموع ${totalImported} سفارش ایمپورت شد.`);
  
  // اجرای بلافاصله فاز ۲
  await calculateCustomerAnalytics();
}

// --- فاز ۲: تحلیل و محاسبه دقیق ---

async function calculateCustomerAnalytics() {
  console.log('\n=============================================');
  console.log('📊 فاز ۲: شروع تحلیل رفتار مشتریان (Analytics)');
  console.log('=============================================');

  const users = await prisma.user.findMany({
    select: { id: true }
  });

  console.log(`👥 در حال آنالیز سوابق ${users.length} مشتری...`);
  let processed = 0;

  for (const user of users) {
    // محاسبه دقیق از روی دیتابیسی که الان ساختیم
    const stats = await prisma.order.aggregate({
      where: {
        user_id: user.id,
        status: 'completed' // فقط سفارش‌های موفق را در جمع کل حساب می‌کنیم
      },
      _sum: {
        final_payable: true
      },
      _count: {
        id: true
      },
      _max: {
        order_date: true // پیدا کردن تاریخ آخرین خرید
      }
    });

    const totalSpent = stats._sum.final_payable || 0;
    const ordersCount = stats._count.id || 0;
    const lastOrder = stats._max.order_date;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        total_spent: totalSpent,
        orders_count: ordersCount,
        last_order_date: lastOrder || undefined
      }
    });

    processed++;
    if (processed % 100 === 0) {
      process.stdout.write(`.`); // نوار پیشرفت ساده
    }
  }

  console.log('\n✅ تمام شد! دیتابیس شما اکنون شامل تمام سوابق مالی، جزئیات سفارش و تحلیل مشتریان است.');
  await prisma.$disconnect();
}

// شروع برنامه
fetchAndImportOrders();