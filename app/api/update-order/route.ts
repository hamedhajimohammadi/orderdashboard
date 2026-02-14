import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logOrderAction } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth';
import { addWooCommerceNote, updateWooCommerceStatus } from '@/lib/woocommerce';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch fresh user data to ensure we have display_name
    const adminUser = await prisma.user.findUnique({
        where: { id: currentUser.id }
    });
    
    let adminDisplayName = adminUser?.display_name;
    if (!adminDisplayName && adminUser?.first_name && adminUser?.last_name) {
        adminDisplayName = `${adminUser.first_name} ${adminUser.last_name}`;
    }
    if (!adminDisplayName) {
        adminDisplayName = adminUser?.admin_username || currentUser.username;
    }

    const { orderId, status: rawStatus, note } = await req.json();
    let status = rawStatus;

    // پیدا کردن سفارش در دیتابیس داخلی
    let existingOrder = null;
    try {
        existingOrder = await prisma.order.findUnique({
            where: { wp_order_id: BigInt(orderId) },
            include: { user: true }
        });
    } catch (e) {
        console.log("Lookup by wp_order_id failed or invalid input");
    }

    if (!existingOrder) {
        try {
            const idAsInt = parseInt(orderId);
            if (!isNaN(idAsInt)) {
                existingOrder = await prisma.order.findUnique({
                    where: { id: idAsInt },
                    include: { user: true }
                });
            }
        } catch (e) {
            console.log("Lookup by id failed");
        }
    }

    if (!existingOrder) {
        return NextResponse.json({ message: 'Order not found in database' }, { status: 404 });
    }

    // اطمینان از اینکه اپراتور ست شده است (فقط اگر وضعیت به waiting تغییر نمی‌کند)
    if (!existingOrder.operator_name && status !== 'waiting') {
            try {
                await prisma.order.update({
                where: { id: existingOrder.id },
                data: { operator_name: adminDisplayName }
                });
            } catch (e) {
                console.error("Failed to set operator name", e);
            }
    }

    // 1️⃣ عملیات اول: تغییر وضعیت
    if (status) {
        console.log(`🔄 Updating Status: Order #${existingOrder.wp_order_id} -> ${status}`);
        
        // نرمال‌سازی ورودی‌ها (چون فرانت‌اند ممکن است مقادیر متفاوتی بفرستد)
        if (status === 'wrong_info') status = 'wrong-info';
        if (status === 'verification') status = 'need-verification';

        // نگاشت وضعیت
        let statusText = status;
        if (status === 'refund-req') { statusText = 'درخواست استرداد'; }
        else if (status === 'refunded') { statusText = 'مسترد شده'; }
        else if (status === 'waiting') { statusText = 'آماده انجام'; }
        else if (status === 'wrong-info') { statusText = 'اطلاعات اشتباه'; }
        else if (status === 'need-verification') { statusText = 'نیاز به احراز'; }
        else if (status === 'completed') { statusText = 'تکمیل شده'; }
        else if (status === 'processing') { statusText = 'در حال انجام'; }
        else if (status === 'cancelled') { statusText = 'لغو شده'; }
        else if (status === 'failed') { statusText = 'ناموفق'; }

        // الف) آپدیت ووکامرس (Mapping handled in lib/woocommerce.ts)
        const wcResult = await updateWooCommerceStatus(existingOrder.wp_order_id, status);

        if (!wcResult) {
            console.error(`⚠️ Failed to update WooCommerce status for Order #${existingOrder.wp_order_id}, but updating local DB anyway.`);
            // می‌توانیم اینجا به کلاینت هشدار دهیم، اما فعلا ادامه می‌دهیم
        }

        // ب) آپدیت دیتابیس داخلی
        const updateData: any = { 
            status: status,
            wp_status: status // We use the same status for now, or we could map it back if needed
        };

        // اگر وضعیت به "آماده انجام" (waiting) تغییر می‌کند، اپراتور را حذف کن
        if (status === 'waiting') {
            updateData.operator_name = null;
            updateData.assigned_at = null;
        }

        // اگر وضعیت تکمیل شده است، زمان تکمیل را ثبت کن
        if (status === 'completed') {
            console.log(`✅ Order #${existingOrder.wp_order_id} completed. Unpinning...`);
            updateData.completed_at = new Date();
            // وقتی سفارش تکمیل می‌شود، اپراتور نهایی را ثبت می‌کنیم (حتی اگر قبلاً کس دیگری بوده)
            updateData.operator_name = adminDisplayName;
            // Unpin the order when completed so it falls back to normal sort
            updateData.is_pinned = false;

            // --- محاسبه امتیاز عملکرد (Quota) ---
            try {
                // 1. پیدا کردن قوانین دسته‌بندی
                const rules = await prisma.categoryRule.findMany();
                const title = (existingOrder.order_title || "").toLowerCase();
                
                // 2. پیدا کردن قانون منطبق
                let matchedRule = rules.find(r => {
                    const keywords = r.keywords.split(',').map(k => k.trim().toLowerCase());
                    return keywords.some(k => k && title.includes(k));
                });

                // 3. اگر قانون خاصی نبود، از قانون عمومی (General) استفاده کن
                if (!matchedRule) {
                    matchedRule = rules.find(r => r.name === 'General' || r.name === 'عمومی');
                }

                // 4. تعیین ضریب سختی (پیش‌فرض ۱)
                const difficulty = matchedRule ? matchedRule.difficulty : 1;

                // 5. آپدیت امتیاز کاربر
                await prisma.user.update({
                    where: { id: currentUser.id },
                    data: {
                        daily_quota: { increment: difficulty } // استفاده از فیلد daily_quota برای ذخیره امتیاز
                    }
                });
                console.log(`⭐ Added ${difficulty} points to admin ${currentUser.username}`);
            } catch (err) {
                console.error("Failed to update admin quota:", err);
            }
            // -----------------------------------
        }

        await prisma.order.update({
            where: { id: existingOrder.id },
            data: updateData
        });

        // ج) ثبت لاگ
        await logOrderAction({
            orderId: existingOrder.id,
            adminName: adminDisplayName,
            action: 'STATUS_CHANGE',
            oldStatus: existingOrder.status,
            newStatus: status,
            description: `تغییر وضعیت به ${status}`
        });

        // د) ارسال یادداشت تغییر وضعیت به ووکامرس
        await addWooCommerceNote(
            existingOrder.wp_order_id,
            `وضعیت سفارش توسط ${adminDisplayName} به "${statusText}" تغییر یافت.`,
            true
        );

        // ه) ارسال پیام تلگرام به مشتری
        if (existingOrder.user?.telegram_chat_id) {
             let msg = '';
             const oid = existingOrder.wp_order_id;
             if (status === 'completed') msg = `✅ <b>سفارش #${oid} تکمیل شد.</b>\n🙏 از خرید شما سپاسگزاریم.\n\n💎 اگر از خدمات ما راضی بودید، خوشحال می‌شویم ما را به دوستان خود معرفی کنید.`;
             else if (status === 'wrong-info') msg = `⚠️ <b>اطلاعات سفارش #${oid} اشتباه است.</b>\n\nلطفا نام کاربری و رمز عبور صحیح را همینجا ارسال کنید.`;
             else if (status === 'need-verification') msg = `🔒 <b>سفارش #${oid} نیاز به احراز هویت دارد.</b>\n\nلطفا تصویر کارت ملی و کارت بانکی خود را ارسال کنید.`;
             else if (status === 'refunded') msg = `💸 <b>سفارش #${oid} مسترد شد.</b>\n\nمبلغ به کیف پول یا حساب بانکی شما بازگشت داده شد.`;
             else if (status === 'processing') msg = `⚡ <b>سفارش #${oid} در حال انجام است.</b>\n\nهمکاران ما هم‌اکنون روی سفارش شما کار می‌کنند. لطفا وارد اکانت خود نشوید.`;
             
             if (msg) await sendTelegramMessage(existingOrder.user.telegram_chat_id, msg);
        }
    }

    // 2️⃣ عملیات دوم: افزودن یادداشت
    if (note) {
        console.log(`📝 Adding Note: ${note}`);
        
        // الف) ثبت در دیتابیس داخلی
        await logOrderAction({
            orderId: existingOrder.id,
            adminName: adminDisplayName,
            action: 'NOTE_ADDED',
            description: note
        });

        // ب) ارسال به ووکامرس
        await addWooCommerceNote(
            existingOrder.wp_order_id,
            `${note}\n(توسط: ${adminDisplayName})`,
            true // یادداشت مشتری
        );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
  }
}

