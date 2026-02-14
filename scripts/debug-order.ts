import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const WC_CK = process.env.WC_CONSUMER_KEY!;
const WC_CS = process.env.WC_CONSUMER_SECRET!;
const WC_URL = siteUrl?.replace(/\/$/, ""); 

async function debugOrders() {
  console.log('🔍 شروع تست دقیق روی ۵ سفارش آخر...');
  
  try {
    const response = await axios.get(`${WC_URL}/wp-json/wc/v3/orders`, {
      params: {
        consumer_key: WC_CK,
        consumer_secret: WC_CS,
        per_page: 5, // فقط ۵ تا سفارش می‌گیریم برای تست
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0',
      },
    });

    const orders = response.data;

    console.log(`📦 ${orders.length} سفارش دریافت شد. بیایید جزئیات را بررسی کنیم:\n`);

    for (const order of orders) {
      console.log('----------------------------------------------------');
      console.log(`🛒 سفارش شماره: #${order.id}`);
      console.log(`👤 مشتری: ${order.billing.first_name} ${order.billing.last_name}`);
      console.log(`📅 تاریخ ثبت: ${order.date_created}`);
      console.log(`🏁 تاریخ تکمیل: ${order.date_completed || 'هنوز تکمیل نشده (NULL)'}`);
      console.log(`💰 مبلغ: ${order.total}`);
      
      console.log('\n📦 اقلام سفارش (و اطلاعات فرم‌ها):');
      order.line_items.forEach((item: any) => {
        console.log(`   🔸 محصول: ${item.name}`);
        
        // چاپ تمام متادیتای محصول (جایی که آیدی بازی و ایمیل معمولا ذخیره میشه)
        if (item.meta_data && item.meta_data.length > 0) {
            console.log('      📝 اطلاعات تکمیلی (فرم‌ها):');
            item.meta_data.forEach((meta: any) => {
                // فیلدهای داخلی ووکامرس که با _ شروع میشن رو نشون نده تا شلوغ نشه
                if (!meta.key.startsWith('_')) {
                    console.log(`         ▪️ ${meta.display_key || meta.key}: ${meta.display_value || meta.value}`);
                }
            });
        } else {
            console.log('      ⚠️ هیچ اطلاعات تکمیلی برای این محصول ثبت نشده.');
        }
      });
      console.log('----------------------------------------------------\n');
    }

  } catch (error: any) {
    console.error('❌ خطا:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugOrders();