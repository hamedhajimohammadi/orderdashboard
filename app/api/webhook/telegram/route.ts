
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage, editTelegramMessage, answerCallbackQuery } from '@/lib/telegram';

// ==========================================
// 📚 Knowledge Base (Help System)
// ==========================================
const KB = {
  games: [
    { id: "codm", emoji: "🎮", title: "Call of Duty Mobile",
      articles: [
        { id: "codm-buy-01", title: "آموزش خرید CP", type: "url", url: "https://pgemshop.com/" },
        { id: "codm-pass-01", title: "تغییر رمز اکانت اکتیویژن", type: "text", body: "1️⃣ وارد سایت <b>activision.com</b> شوید.\n2️⃣ از منوی بالا روی <b>Profile</b> کلیک کنید.\n3️⃣ وارد بخش <b>Security</b> شوید.\n4️⃣ روی <b>Change Password</b> کلیک کنید.\n⚠️ <i>رمز قوی و غیرتکراری انتخاب کنید.</i>" },
        { id: "codm-ver-01", title: "احراز هویت سریع", type: "text", body: "مدارک لازم:\n▫️ کارت ملی\n▫️ کارت بانکی\n▫️ دست‌نوشته با تاریخ روز\n\n📸 <b>یک عکس واضح</b> از چیدمان این موارد کنار هم بگیرید و برای پشتیبانی ارسال کنید." }
      ]
    },
    { id: "fcm", emoji: "⚽", title: "FC Mobile",
      articles: [
        { id: "fcm-buy-01", title: "روش خرید FP", type: "url", url: "https://pgemshop.com/" },
        { id: "fcm-login-01", title: "مشکلات ورود/EA ID", type: "text", body: "🛡 <b>امنیت اکانت:</b>\nEA ID خود را امن نگه دارید و تایید دو مرحله‌ای (2FA) را فعال کنید.\n\nدر صورت قفل شدن اکانت:\nبه ea.com/help بروید و مسیر Account > Security را طی کنید." }
      ]
    },
    { id: "coc", emoji: "🏰", title: "Clash of Clans",
      articles: [
        { id: "coc-gp-01", title: "خرید Gold Pass", type: "url", url: "https://pgemshop.com/" },
        { id: "coc-mail-01", title: "تغییر/بازیابی ایمیل سوپرسل", type: "text", body: "مسیر زیر را طی کنید:\nSettings ➡️ Help & Support ➡️ Contact Us\n\nسپس درخواست تغییر ایمیل دهید و مراحل تأیید را انجام دهید." }
      ]
    },
    { id: "cr", emoji: "🧙", title: "Clash Royale",
      articles: [{ id: "cr-pass-01", title: "Royale Pass", type: "text", body: "از قسمت <b>Shop</b> گزینه <b>Pass Royale</b> را انتخاب کرده و مراحل خرید را تکمیل کنید." }]
    },
    { id: "ff", emoji: "🔥", title: "Free Fire",
      articles: [{ id: "ff-buy-01", title: "آموزش خرید جم", type: "text", body: "لطفاً <b>UID</b> خود را چک کنید، روش پرداخت مناسب را انتخاب کرده و سفارش را ثبت کنید." }]
    },
    { id: "rbx", emoji: "🎲", title: "Roblox",
      articles: [{ id: "rbx-01", title: "روش خرید روباکس", type: "url", url: "https://pgemshop.com/" }]
    },
    { id: "efb", emoji: "🏟", title: "eFootball",
      articles: [
        { id: "efb-buy-01", title: "خرید سکه (eFootball Coins)", type: "url", url: "https://pgemshop.com/" },
        { id: "efb-kid-01", title: "اتصال/امن‌سازی KONAMI ID", type: "text", body: "به <b>my.konami.net</b> بروید و وارد شوید.\nگزینه <b>Two-Step Verification</b> را فعال کنید.\nحتماً از ایمیل معتبر و رمز عبور قوی استفاده کنید." },
        { id: "efb-trb-01", title: "حل مشکلات ورود", type: "text", body: "اگر ورود ناموفق بود:\n1. Password reset انجام دهید.\n2. کش بازی را پاک کنید.\n3. محدودیت منطقه‌ای اینترنت (DNS/VPN) را بررسی کنید." }
      ]
    },
    { id: "site", emoji: "🛒", title: "آموزش‌های سایت (خرید و پشتیبانی)",
      articles: [
        { id: "site-buy", title: "نحوه خرید از سایت", type: "text", body: "<b>مراحل خرید:</b>\n1️⃣ محصول را انتخاب کنید.\n2️⃣ اطلاعات اکانت/UID را دقیق وارد کنید.\n3️⃣ پرداخت را انجام دهید.\n4️⃣ سفارش را در بخش <code>/order</code> یا پنل کاربری پیگیری کنید." },
        { id: "site-verify", title: "آموزش کامل احراز هویت", type: "text", body: "🔐 <b>چرا احراز هویت؟</b>\nبرای خریدهای مبالغ بالا و سفارش‌های حساس، طبق دستور پلیس فتا و قوانین سایت، احراز هویت الزامی است.\n\n📝 <b>مدارک مورد نیاز:</b>\n1. کارت ملی صاحب حساب\n2. کارت بانکی پرداخت کننده\n3. متن دست‌نوشته: «درخواست خرید از پی‌جم‌شاپ + تاریخ»\n\n📸 <b>روش ارسال:</b>\nاز این سه مورد کنار هم عکس بگیرید و در لینک زیر آپلود کنید:\n<a href=\"https://pgemshop.com/my-account/authentication/\">🔗 لینک ارسال مدارک</a>" },
        { id: "site-verify-form", title: "صفحه احراز هویت (آنلاین)", type: "url", url: "https://pgemshop.com/my-account/authentication/" },
        { id: "site-refund", title: "شرایط بازگشت وجه", type: "text", body: "💸 <b>شرایط عودت وجه:</b>\nدر صورت عدم انجام سفارش یا بروز مشکل غیرقابل‌حل، امکان عودت وجه وجود دارد.\n\n<b>مراحل:</b>\n1️⃣ به بخش «حساب کاربری من» > «عودت وجه» بروید.\n2️⃣ فرم را با شماره سفارش و شماره کارت تکمیل کنید.\n\n⚠️ <b>نکات مهم:</b>\n• مبلغ پس از کسر <b>۹٪ مالیات</b> عودت داده می‌شود.\n• سفارشات تکمیل‌شده قابل استرداد نیستند." },
        { id: "site-refund-form", title: "فرم عودت وجه (آنلاین)", type: "url", url: "https://pgemshop.com/my-account/refund/" },
        { id: "site-time", title: "زمان انجام سفارش‌ها", type: "text", body: "⏱ <b>زمان انجام کار:</b>\nسفارشات اتوماتیک: <b>فوری</b>\nسفارشات دستی: <b>۱۵ دقیقه تا ۶ ساعت</b>\n\n⏰ ساعات کاری: ۰۹:۰۰ تا ۲۴:۰۰" }
      ]
    }
  ]
};

// ==========================================
// 🛠 Helper Functions
// ==========================================
const findGame = (gid: string) => KB.games.find(g => g.id === gid);

function kbGames() {
  const rows = [];
  for (let i = 0; i < KB.games.length; i += 2) {
    const a = KB.games[i], b = KB.games[i + 1];
    const row = [{ text: `${a.emoji} ${a.title}`, callback_data: `g:${a.id}` }];
    if (b) row.push({ text: `${b.emoji} ${b.title}`, callback_data: `g:${b.id}` });
    rows.push(row);
  }
  return rows;
}

function kbArticles(game: any) {
  const rows = game.articles.map((a: any) => [{ text: `📄 ${a.title}`, callback_data: `a:${game.id}:${a.id}` }]);
  rows.push([{ text: "⬅️ بازگشت به لیست بازی‌ها", callback_data: "back:l1" }]);
  return rows;
}

function normalizeDigits(s: string = '') {
  const map: any = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
  return String(s).replace(/[۰-۹٠-٩]/g, d => map[d]);
}

async function getOrderStatusMessage(orderId: string | number) {
  // Try to find in Prisma first (Fastest)
  // Note: We assume wp_order_id is stored as BigInt
  let order = await prisma.order.findUnique({
    where: { wp_order_id: BigInt(orderId) },
    include: { user: true }
  });

  if (!order) {
    // Fallback: Try to find by internal ID if it matches
    const internalOrder = await prisma.order.findUnique({
        where: { id: parseInt(orderId.toString()) },
        include: { user: true }
    });
    if (internalOrder) order = internalOrder;
  }

  if (!order) return null;

  const statusMap: any = {
    'processing': '⏳ در حال پردازش',
    'completed': '✅ تکمیل شده',
    'on-hold': '⏸ در انتظار پرداخت',
    'pending': '🕒 در انتظار',
    'cancelled': '❌ لغو شده',
    'refunded': '↩️ مرجوع شده',
    'failed': '⚠️ ناموفق',
    'need-verification': '🆔 نیاز به احراز هویت',
    'waiting': '🕒 در صف انجام'
  };

  const statusFa = statusMap[order.status] || order.status;
  const totalFa = parseInt(order.final_payable.toString()).toLocaleString('fa-IR');
  const items = (order.snapshot_data as any)?.line_items || [];
  const itemsTxt = items.map((li: any) => `▫️ <b>${li.name}</b> × ${li.quantity}`).join('\n') || '—';

  let statusNote = '';
  if (order.status === 'processing') {
    statusNote = '\n💡 <b>نکته:</b> سفارش شما در صف انجام است. لطفاً صبور باشید.';
  }

  const text = `💎 <b>سفارش شماره #${order.wp_order_id}</b>\n` +
    `وضعیت: <b>${statusFa}</b>\n` +
    `💰 مبلغ: <code>${totalFa} تومان</code>\n` +
    `────────────────\n` +
    `🛍 <b>اقلام:</b>\n` +
    `${itemsTxt}\n` +
    `${statusNote}\n\n` +
    `<i>برای مشاهده جزئیات بیشتر دکمه‌های زیر را بزنید:</i>`;

  const replyMarkup = {
    inline_keyboard: [
      [{ text: '🔄 به‌روزرسانی وضعیت', callback_data: `refresh:${order.wp_order_id}` }],
      [{ text: '🧾 مشاهده در سایت', url: `https://pgemshop.com/my-account/view-order/${order.wp_order_id}/` }],
    ],
  };

  return { text, replyMarkup, order };
}

// ==========================================
// 🚀 Main Webhook Handler
// ==========================================
export async function POST(req: Request) {
  try {
    const update = await req.json();
    
    // A. Handle Callback Queries (Buttons)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const messageId = cb.message.message_id;
      const data = cb.data;

      // 1. Help System Navigation
      if (data === 'back:l1') {
        await editTelegramMessage(chatId, messageId, "📚 <b>مرکز آموزش‌ها</b>\n\nبرای دیدن راهنما، بازی یا بخش مورد نظر را انتخاب کنید: 👇", 'order', { inline_keyboard: kbGames() });
      } 
      else if (data.startsWith('g:')) {
        const gid = data.slice(2);
        const game = findGame(gid);
        if (game) {
            await editTelegramMessage(chatId, messageId, `🎮 <b>${game.title}</b>\n\nیک موضوع را انتخاب کنید:`, 'order', { inline_keyboard: kbArticles(game) });
        }
      }
      else if (data.startsWith('a:')) {
        const [, gid, aid] = data.split(':');
        const game = findGame(gid);
        const art = game?.articles.find(a => a.id === aid);
        if (game && art) {
            let text = art.type === 'url' ? `🔗 <b>${art.title}</b>\n${art.url}` : `🔹 <b>${game.title}</b>\n\n${art.body}`;
            await editTelegramMessage(chatId, messageId, text, 'order', { inline_keyboard: kbArticles(game) });
        }
      }
      // 2. Order Refresh
      else if (data.startsWith('refresh:')) {
        const orderId = data.split(':')[1];
        const result = await getOrderStatusMessage(orderId);
        if (result) {
            // Add timestamp to force update if text is same
            const time = new Date().toLocaleTimeString('fa-IR', {timeZone: 'Asia/Tehran'});
            await editTelegramMessage(chatId, messageId, result.text + `\n\n🕒 بروزرسانی: ${time}`, 'order', result.replyMarkup);
            await answerCallbackQuery(cb.id, 'وضعیت بروزرسانی شد ✅');
        } else {
            await answerCallbackQuery(cb.id, 'سفارش یافت نشد ❌', true);
        }
      }

      await answerCallbackQuery(cb.id);
      return NextResponse.json({ ok: true });
    }

    // B. Handle Text Messages
    if (!update.message || !update.message.text) return NextResponse.json({ ok: true });

    const chatId = update.message.chat.id;
    const rawText = update.message.text;
    const text = normalizeDigits(rawText).trim();
    const user = update.message.from;

    // --- 1. Commands ---
    if (text === '/start' || text === '/help') {
      const welcome = `👋 <b>سلام! به پی‌جم‌بات خوش آمدید</b> 🤖\n\nمن دستیار هوشمند شما برای خدمات <b>PGEM Shop</b> هستم. چطور می‌توانم کمکتان کنم؟\n\n👇 <b>دسترسی سریع:</b>\n• /help — 📚 <b>آموزش‌ها و راهنما</b>\n• /order — 🔎 <b>پیگیری سفارش</b>\n• /support — 🎧 <b>ارتباط با پشتیبانی</b>\n\n<i>برای شروع، یکی از دستورات بالا را لمس کنید.</i>`;
      
      // If /help, show menu directly
      if (text === '/help') {
         await sendTelegramMessage(chatId, "📚 <b>مرکز آموزش‌ها</b>\n\nبرای دیدن راهنما، بازی یا بخش مورد نظر را انتخاب کنید: 👇", 'order', { inline_keyboard: kbGames() });
      } else {
         await sendTelegramMessage(chatId, welcome, 'order');
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '/support') {
        await sendTelegramMessage(chatId, "🎧 <b>راه‌های ارتباط با پشتیبانی پی‌جم‌شاپ:</b>\n\n📱 <b>تلگرام:</b> <a href=\"https://t.me/Pgemshop_cp\">@Pgemshop_cp</a>\n☎️ <b>تلفن:</b> <code>021-91693865</code>\n⏰ <b>ساعات کاری:</b> هر روز 09:00 تا 24:00\n\n<i>همکاران ما در سریع‌ترین زمان ممکن پاسخگوی شما هستند.</i> ❤️", 'order');
        return NextResponse.json({ ok: true });
    }

    if (text === '/verify') {
        await sendTelegramMessage(chatId, "🛡 <b>آموزش احراز هویت در پی‌جم‌شاپ</b>\n\nبرای تأیید سفارش خود، مراحل زیر را انجام دهید:\n\n1️⃣ کارت ملی و کارت بانکی (پرداخت‌کننده) را آماده کنید.\n2️⃣ روی یک کاغذ سفید بنویسید:\n📝 <code>درخواست خرید از پی‌جم‌شاپ - تاریخ روز</code>\n3️⃣ کارت‌ها و کاغذ را کنار هم بگذارید و یک <b>عکس واضح</b> بگیرید.\n4️⃣ عکس را از طریق پشتیبانی سایت ارسال کنید.\n\n⚠️ <b>نکته مهم:</b> اگر سن دارنده کارت بالای ۴۰ سال است، ممکن است جهت تأیید نهایی با شما تماس گرفته شود.", 'order');
        return NextResponse.json({ ok: true });
    }

    if (text === '/order') {
        await sendTelegramMessage(chatId, "لطفاً <b>شماره سفارش</b> خود را ارسال کنید (فقط عدد ۴ تا ۷ رقمی).", 'order', { force_reply: true });
        return NextResponse.json({ ok: true });
    }

    // --- 2. Order Tracking Logic ---
    // Check if it's an order number (4-8 digits)
    const orderMatch = text.match(/^(\d{4,8})$/) || text.match(/^track[_-]?(\d{4,8})$/i);
    
    if (orderMatch) {
        const orderId = orderMatch[1];
        const result = await getOrderStatusMessage(orderId);

        if (result) {
            await sendTelegramMessage(chatId, result.text, 'order', result.replyMarkup);
            
            // Sync Telegram User with DB
            if (result.order.user_id) {
                await prisma.user.update({
                    where: { id: result.order.user_id },
                    data: { 
                        telegram_chat_id: BigInt(chatId),
                        telegram_username: user.username || null,
                        first_name: user.first_name || null,
                        last_name: user.last_name || null
                    }
                }).catch(e => console.error("User Sync Error:", e));
            }
        } else {
            await sendTelegramMessage(chatId, "❌ <b>خطا:</b> سفارش پیدا نشد.\nلطفاً شماره سفارش ۴ تا ۷ رقمی را صحیح ارسال کنید.", 'order');
        }
        return NextResponse.json({ ok: true });
    }

    // --- 3. Fallback: Save as Message/Log ---
    // If it's not a command and not an order number, treat as a support message
    // Find User
    const dbUser = await prisma.user.findFirst({
      where: { telegram_chat_id: BigInt(chatId) }
    });

    if (dbUser) {
        const activeOrder = await prisma.order.findFirst({
            where: {
                user_id: dbUser.id,
                status: { in: ['processing', 'pending', 'on-hold', 'waiting'] }
            },
            orderBy: { created_at: 'desc' }
        });

        if (activeOrder) {
            await prisma.orderLog.create({
                data: {
                    order_id: activeOrder.id,
                    action: 'پیام مشتری',
                    admin_name: dbUser.first_name || 'مشتری',
                    description: `📩 ${rawText}`,
                }
            });
            // Optional: Confirm receipt
            // await sendTelegramMessage(chatId, "✅ پیام شما دریافت شد.", 'order');
        } else {
             await sendTelegramMessage(chatId, "📭 سفارش فعالی برای شما پیدا نشد. برای پیگیری سفارش قدیمی، شماره سفارش را ارسال کنید.", 'order');
        }
    } else {
        await sendTelegramMessage(chatId, "⛔ شما در سیستم شناسایی نشدید. لطفا ابتدا شماره سفارش خود را ارسال کنید تا سیستم شما را بشناسد.", 'order');
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
