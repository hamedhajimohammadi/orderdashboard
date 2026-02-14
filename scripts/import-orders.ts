import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (!siteUrl || !siteUrl.startsWith('http')) {
  console.error('❌ خطا: آدرس سایت تنظیم نشده است.');
  process.exit(1);
}

const WC_CK = process.env.WC_CONSUMER_KEY!;
const WC_CS = process.env.WC_CONSUMER_SECRET!;
const WC_URL = siteUrl.replace(/\/$/, ""); 
const AFFILIATE_CODES = ['adeltekno', 'se7en', 'hojat', 'fcmobo'];

// 👇👇👇 کوکی طولانی که کپی کردی را دقیقاً اینجا بین دو گیومه بگذار 👇👇👇
const MY_COOKIE = `uap_test_cookie=1; wp-settings-time-23595=1747577925; wp-settings-23595=posts_list_mode%3Dlist%26libraryContent%3Dbrowse; tk_or=%22https%3A%2F%2Fsearch.google.com%2F%22; tk_lr=%22%22; _ga=GA1.1.1440994772.1757049625; woodmart_wishlist_count=2; woodmart_wishlist_hash=9ff111c47078b60ccfa4d8ae6165387a; mp_a36067b00a263cce0299cfd960e26ecf_mixpanel=%7B%22distinct_id%22%3A%22%24device%3A7ad6ab93-3ccb-4a50-94f0-02fe9ca09f06%22%2C%22%24device_id%22%3A%227ad6ab93-3ccb-4a50-94f0-02fe9ca09f06%22%2C%22%24initial_referrer%22%3A%22https%3A%2F%2Fpgemshop.com%2Fwp-admin%2Foptions-general.php%3Fpage%3Dwprocket%22%2C%22%24initial_referring_domain%22%3A%22pgemshop.com%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%22%24initial_referrer%22%3A%22https%3A%2F%2Fpgemshop.com%2Fwp-admin%2Foptions-general.php%3Fpage%3Dwprocket%22%2C%22%24initial_referring_domain%22%3A%22pgemshop.com%22%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%7D; wp-settings-2=libraryContent%3Dbrowse%26posts_list_mode%3Dlist%26editor%3Dtinymce%26advImgDetails%3Dshow%26hidetb%3D1%26imgsize%3Dfull%26align%3Dcenter%26editor_plain_text_paste_warning%3D1%26mfold%3D%26yithFwSidebarFold%3Do; wp-settings-time-2=1766525762; sbjs_migrations=1418474375998%3D1; sbjs_current_add=fd%3D2025-12-27%2006%3A49%3A13%7C%7C%7Cep%3Dhttps%3A%2F%2Fpgemshop.com%2F%7C%7C%7Crf%3D%28none%29; sbjs_first_add=fd%3D2025-12-27%2006%3A49%3A13%7C%7C%7Cep%3Dhttps%3A%2F%2Fpgemshop.com%2F%7C%7C%7Crf%3D%28none%29; sbjs_current=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29%7C%7C%7Cplt%3D%28none%29%7C%7C%7Cfmt%3D%28none%29%7C%7C%7Ctct%3D%28none%29; sbjs_first=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29%7C%7C%7Cplt%3D%28none%29%7C%7C%7Cfmt%3D%28none%29%7C%7C%7Ctct%3D%28none%29; wordpress_test_cookie=WP%20Cookie%20check; wordpress_logged_in_b52ec49a7c2de7af03daa5ec45587e2c=Hamedhajimohammadi%7C1766990965%7CeWhhiJhy0jqhHPl96geO9msmjtPWvxGNaDueW8J4Ho5%7C1c1da9f6a060c4680d1d0e8174bf4b72a3ebf80caf52772408dc9b9255f8c3f4; woodmart_recently_viewed_products=779%7C781%7C797%7C555091%7C892%7C574213%7C5039726; _clck=1k8ond2%5E2%5Eg28%5E0%5E1938; sbjs_udata=vst%3D5%7C%7C%7Cuip%3D%28none%29%7C%7C%7Cuag%3DMozilla%2F5.0%20%28Linux%3B%20Android%206.0%3B%20Nexus%205%20Build%2FMRA58N%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F143.0.0.0%20Mobile%20Safari%2F537.36; sbjs_session=pgs%3D1%7C%7C%7Ccpg%3Dhttps%3A%2F%2Fpgemshop.com%2F; _ga_LBPT6DC1WN=GS2.1.s1766926240$o105$g0$t1766926240$j60$l0$h0; _clsk=flvimv%5E1766926241449%5E1%5E1%5Es.clarity.ms%2Fcollect; Human=16176692755742:88.234.244.63`; 
// مثال: const MY_COOKIE = `wp_logged_in_...; ar_debug=...;`;

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

async function fetchAndImportOrders() {
  console.log('=============================================');
  console.log('🚀 شروع دانلود (بدون کوکی)');
  
  // if (MY_COOKIE.includes('uap_test_cookie=1; wp-settings-time-23595=1747577925; wp-settings-23595=posts_list_mode%3Dlist%26libraryContent%3Dbrowse; tk_or=%22https%3A%2F%2Fsearch.google.com%2F%22; tk_lr=%22%22; _ga=GA1.1.1440994772.1757049625; woodmart_wishlist_count=2; woodmart_wishlist_hash=9ff111c47078b60ccfa4d8ae6165387a; mp_a36067b00a263cce0299cfd960e26ecf_mixpanel=%7B%22distinct_id%22%3A%22%24device%3A7ad6ab93-3ccb-4a50-94f0-02fe9ca09f06%22%2C%22%24device_id%22%3A%227ad6ab93-3ccb-4a50-94f0-02fe9ca09f06%22%2C%22%24initial_referrer%22%3A%22https%3A%2F%2Fpgemshop.com%2Fwp-admin%2Foptions-general.php%3Fpage%3Dwprocket%22%2C%22%24initial_referring_domain%22%3A%22pgemshop.com%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%22%24initial_referrer%22%3A%22https%3A%2F%2Fpgemshop.com%2Fwp-admin%2Foptions-general.php%3Fpage%3Dwprocket%22%2C%22%24initial_referring_domain%22%3A%22pgemshop.com%22%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%7D; wp-settings-2=libraryContent%3Dbrowse%26posts_list_mode%3Dlist%26editor%3Dtinymce%26advImgDetails%3Dshow%26hidetb%3D1%26imgsize%3Dfull%26align%3Dcenter%26editor_plain_text_paste_warning%3D1%26mfold%3D%26yithFwSidebarFold%3Do; wp-settings-time-2=1766525762; sbjs_migrations=1418474375998%3D1; sbjs_current_add=fd%3D2025-12-27%2006%3A49%3A13%7C%7C%7Cep%3Dhttps%3A%2F%2Fpgemshop.com%2F%7C%7C%7Crf%3D%28none%29; sbjs_first_add=fd%3D2025-12-27%2006%3A49%3A13%7C%7C%7Cep%3Dhttps%3A%2F%2Fpgemshop.com%2F%7C%7C%7Crf%3D%28none%29; sbjs_current=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29%7C%7C%7Cplt%3D%28none%29%7C%7C%7Cfmt%3D%28none%29%7C%7C%7Ctct%3D%28none%29; sbjs_first=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29%7C%7C%7Cplt%3D%28none%29%7C%7C%7Cfmt%3D%28none%29%7C%7C%7Ctct%3D%28none%29; wordpress_test_cookie=WP%20Cookie%20check; woodmart_recently_viewed_products=779%7C781%7C797%7C555091%7C892%7C574213%7C5039726; Human=18176701948714:212.252.133.131; wordpress_logged_in_b52ec49a7c2de7af03daa5ec45587e2c=Hamedhajimohammadi%7C1767192294%7CgaFGE72cYtYLfYZZ35P1j1CW6DertpilsQcKU6TifFq%7Cfbcbcdcc39891ce3db7e383eafd1721efa27e53045332976c5ee825952b03f32; _ga_LBPT6DC1WN=GS2.1.s1767019506$o107$g0$t1767019506$j60$l0$h0; _clck=1k8ond2%5E2%5Eg29%5E0%5E1938; _clsk=mw08gc%5E1767019507482%5E1%5E1%5Ek.clarity.ms%2Fcollect; sbjs_udata=vst%3D6%7C%7C%7Cuip%3D%28none%29%7C%7C%7Cuag%3DMozilla%2F5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F143.0.0.0%20Safari%2F537.36; sbjs_session=pgs%3D1%7C%7C%7Ccpg%3Dhttps%3A%2F%2Fpgemshop.com%2F') || MY_COOKIE.length < 10) {
  //     console.error('❌ خطا: لطفاً مقدار MY_COOKIE را در خط ۱۸ فایل تنظیم کنید!');
  //     process.exit(1);
  // }

  console.log('=============================================');
  
  let page = 1;
  let hasNextPage = true;
  let totalImported = 0;
  let lastFirstOrderId = null; 

  while (hasNextPage) {
    try {
      console.log(`📥 دریافت صفحه ${page}...`);
      
      const response = await axios.get(`${WC_URL}/wp-json/wc/v3/orders`, {
        params: {
          consumer_key: WC_CK,
          consumer_secret: WC_CS,
          per_page: 100, 
          page: page,
        },
        headers: {
          // جعل هویت مرورگر
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cookie': MY_COOKIE, 
          'Cache-Control': 'no-cache',
        },
        timeout: 60000 
      });

      const orders = response.data;

      // بررسی مجدد برای اطمینان (چون گاهی با وجود کوکی باز هم ریدایرکت میده)
      if (!Array.isArray(orders)) {
          console.log("\n⛔ باز هم HTML دریافت شد!");
          if (typeof orders === 'string' && orders.includes('Redirecting')) {
               console.log("⚠️ کوکی منقضی شده یا اشتباه کپی شده است. لطفا کوکی جدید بگیرید.");
          } else {
               console.log("خروجی:", String(orders).substring(0, 200));
          }
          break;
      }

      if (orders.length === 0) {
        hasNextPage = false;
        console.log('✅ لیست تمام شد.');
        break;
      }

      const currentFirstId = orders[0].id;
      if (lastFirstOrderId === currentFirstId) {
          console.error(`⛔ صفحه تکراری (ID: ${currentFirstId}). توقف.`);
          break;
      }
      lastFirstOrderId = currentFirstId;

      console.log(`💾 پردازش ${orders.length} سفارش...`);

      for (const order of orders) {
        try {
            const billing = order.billing || {};
            let rawPhone = billing.phone || '';
            let normalizedPhone = normalizePhoneNumber(rawPhone);

            if (!normalizedPhone) normalizedPhone = `989000${order.id}`; 

            const metaData = Array.isArray(order.meta_data) ? order.meta_data : [];
            const feeLines = Array.isArray(order.fee_lines) ? order.fee_lines : [];
            const couponLines = Array.isArray(order.coupon_lines) ? order.coupon_lines : [];

            // تلگرام
            let chatID = null;
            let username = null;
            if (metaData.length > 0) {
                const cMeta = metaData.find((m: any) => m.key === '_telegram_chat_id');
                if (cMeta) chatID = cMeta.value;
                const uMeta = metaData.find((m: any) => m.key === '_telegram_username');
                if (uMeta) username = uMeta.value;
            }

            // کاربر
            const user = await prisma.user.upsert({
                where: { phone_number: normalizedPhone },
                update: {
                    first_name: billing.first_name || 'کاربر',
                    last_name: billing.last_name || `مهمان-${order.id}`,
                    ...(chatID && { telegram_chat_id: BigInt(chatID) }),
                    ...(username && { telegram_username: username }),
                },
                create: {
                    phone_number: normalizedPhone,
                    first_name: billing.first_name || 'کاربر',
                    last_name: billing.last_name || `مهمان-${order.id}`,
                    telegram_chat_id: chatID ? BigInt(chatID) : null,
                    telegram_username: username,
                    orders_count: 0, 
                    total_spent: 0,
                }
            });

            // محاسبات مالی
            let discountType = 'none';
            let loyaltyAmount = 0;
            let loyaltyRedeemed = 0;
            
            const pjsFee = feeLines.find((f: any) => f.name && (f.name.includes('کسر از اعتبار') || f.name.includes('الماس')));
            if (pjsFee) {
                loyaltyAmount = Math.abs(parseFloat(pjsFee.total || '0'));
                discountType = 'loyalty_points';
            }
            
            const redeemMeta = metaData.find((m: any) => m.key === '_pjs_points_to_deduct');
            if (redeemMeta) loyaltyRedeemed = parseInt(redeemMeta.value || '0');

            let affiliateCode = null;
            let affiliateAmount = 0;
            let couponCode = null;
            let couponAmount = 0;
            
            if (couponLines.length > 0) {
                const coupon = couponLines[0];
                const code = coupon.code;
                const amount = parseFloat(coupon.discount || '0');
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

            const totalPayable = parseFloat(order.total || '0');
            const totalGross = totalPayable + loyaltyAmount + affiliateAmount + couponAmount;

            const dateCreated = new Date(order.date_created);
            const dateCompleted = order.date_completed ? new Date(order.date_completed) : null;

            // منطق تعیین وضعیت داخلی
            let internalStatus = 'pending';
            if (order.status === 'processing') {
                internalStatus = 'waiting'; // پیش‌فرض برای ایمپورت اولیه
            } else if (order.status === 'completed') {
                internalStatus = 'completed';
            } else if (order.status === 'cancelled') {
                internalStatus = 'cancelled';
            } else if (order.status === 'failed') {
                internalStatus = 'failed';
            }

            // در ایمپورت، چون نمی‌دانیم قبلاً دست کسی بوده یا نه، اگر در دیتابیس باشد وضعیتش را حفظ می‌کنیم
            // اما اینجا upsert است. اگر create شود، waiting می‌شود.
            // اگر update شود، باید حواسمان باشد وضعیت processing (دست ادمین) را خراب نکنیم.
            // پس در update وضعیت را فقط اگر completed/cancelled شده تغییر می‌دهیم.
            
            // راه حل بهتر برای ایمپورت: اول چک کنیم
            const existing = await prisma.order.findUnique({ where: { wp_order_id: BigInt(order.id) }});
            let statusToUpdate = internalStatus;
            
            if (existing) {
                if (existing.status === 'processing' && order.status === 'processing') {
                    statusToUpdate = 'processing'; // دست نزن
                } else if (order.status !== existing.wp_status) {
                    // وضعیت ووکامرس عوض شده، پس وضعیت داخلی هم باید سینک شود
                    statusToUpdate = internalStatus;
                } else {
                    // وضعیت ووکامرس عوض نشده، وضعیت داخلی را حفظ کن
                    statusToUpdate = existing.status;
                }
            }

            await prisma.order.upsert({
                where: { wp_order_id: BigInt(order.id) },
                update: {
                    status: statusToUpdate,
                    wp_status: order.status,
                    final_payable: totalPayable,
                    total_amount_gross: totalGross,
                    order_title: generateOrderTitle(order.line_items),
                    order_date: dateCreated,
                    completed_at: dateCompleted,
                    snapshot_data: order, 
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
                    status: internalStatus,
                    wp_status: order.status,
                    snapshot_data: order, 
                    order_title: generateOrderTitle(order.line_items),
                    order_date: dateCreated,
                    completed_at: dateCompleted,
                    created_at: new Date()
                }
            });
            
            totalImported++;

        } catch (innerError: any) {
             // سکوت در برابر خطاهای جزئی
        }
      }

      console.log(`✅ صفحه ${page} کامل شد. (مجموع: ${totalImported})`);
      page++;

    } catch (error: any) {
      console.error('❌ خطا:', error.message);
      if (error.response) console.error(error.response.status);
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  console.log(`🏁 پایان دانلود. مجموع ${totalImported} سفارش ذخیره شد.`);
  await calculateCustomerAnalytics();
}

async function calculateCustomerAnalytics() {
  console.log('\n📊 به روز رسانی آمار...');
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    const stats = await prisma.order.aggregate({
      where: { user_id: user.id, status: 'completed' },
      _sum: { final_payable: true },
      _count: { id: true },
      _max: { order_date: true }
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        total_spent: stats._sum.final_payable || 0,
        orders_count: stats._count.id || 0,
        last_order_date: stats._max.order_date || undefined
      }
    });
  }
  console.log('✅ تمام شد.');
  await prisma.$disconnect();
}

fetchAndImportOrders();