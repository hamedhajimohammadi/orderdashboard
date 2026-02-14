
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');

    const now = new Date();
    const start = startStr ? new Date(startStr) : new Date(now.getFullYear(), now.getMonth(), 1); // اول ماه جاری
    const end = endStr ? new Date(endStr) : new Date();

    // 1. محاسبه درآمد کل (فروش ناخالص)
    // فقط سفارشات تکمیل شده
    const completedOrders = await prisma.order.findMany({
      where: {
        status: 'completed',
        completed_at: {
          gte: start,
          lte: end
        }
      },
      select: {
        final_payable: true,
        total_amount_gross: true,
        affiliate_amount: true,
        coupon_amount: true,
        loyalty_amount: true,
        snapshot_data: true // برای استخراج دسته‌بندی‌ها
      }
    });

    // 2. محاسبه هزینه‌ها
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: start,
          lte: end
        }
      }
    });

    // 3. دریافت مارجین‌ها
    const margins = await prisma.categoryMargin.findMany();
    const marginMap = new Map(margins.map(m => [m.wc_id.toString(), m.margin_percent]));

    // --- محاسبات ---
    let totalRevenue = 0; // درآمد کل (پرداختی مشتری)
    let totalCOGS = 0; // هزینه تمام شده کالا (تخمینی)
    let totalAffiliateCost = 0;
    let totalDiscounts = 0; // تخفیف‌های داده شده (کوپن + وفاداری)

    for (const order of completedOrders) {
      totalRevenue += Number(order.final_payable);
      totalAffiliateCost += Number(order.affiliate_amount);
      totalDiscounts += Number(order.coupon_amount) + Number(order.loyalty_amount);

      // محاسبه COGS بر اساس دسته‌بندی آیتم‌ها
      // فرض: اگر آیتم‌ها در snapshot_data باشند
      // ساختار snapshot_data معمولا شامل line_items است
      const snapshot = order.snapshot_data;
      if (snapshot && snapshot.line_items) {
        for (const item of snapshot.line_items) {
            // اگر category_ids داشته باشیم (معمولا آرایه است)
            // فرض ساده: اولین دسته‌بندی را می‌گیریم
            // در ووکامرس line_item معمولا category_id مستقیم ندارد، باید از product lookup استفاده کرد
            // اما اگر در ایمپورت ذخیره کرده باشیم...
            // اگر نداریم، فعلا یک مارجین پیش‌فرض یا میانگین در نظر می‌گیریم
            // *نکته:* برای دقت بالا، باید در ایمپورت سفارشات، category_id هر محصول را هم ذخیره کنیم.
            // فعلا فرض می‌کنیم مارجین کلی ۲۰٪ است اگر پیدا نشد.
            
            // راه حل موقت: استفاده از total_amount_gross برای محاسبه سود ناخالص
            // اگر مارجین را ندانیم، نمی‌توانیم سود را حساب کنیم.
            // بیایید فرض کنیم کاربر یک "مارجین پیش‌فرض" دارد.
        }
      }
      
      // چون فعلا دیتای دقیق دسته‌بندی در line_items نداریم، 
      // فرض می‌کنیم سود ناخالص میانگین ۱۵٪ است (قابل تنظیم)
      // در فاز بعدی باید ایمپورت را اصلاح کنیم.
      // totalCOGS += Number(order.total_amount_gross) * (1 - 0.15); 
    }

    // محاسبه دقیق‌تر سود ناخالص با فرض اینکه مارجین‌ها روی کل فروش اعمال می‌شوند (فعلا)
    // در آینده باید دقیق شود.
    const estimatedGrossMargin = 0.15; // ۱۵ درصد
    const grossProfit = totalRevenue * estimatedGrossMargin; 

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    const netProfit = grossProfit - totalExpenses - totalAffiliateCost;

    return NextResponse.json({
      success: true,
      data: {
        period: { start, end },
        revenue: totalRevenue,
        expenses: totalExpenses,
        affiliateCost: totalAffiliateCost,
        discounts: totalDiscounts,
        grossProfit: grossProfit, // سود ناخالص تخمینی
        netProfit: netProfit,
        ordersCount: completedOrders.length
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
