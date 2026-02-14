import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id'); // This is expected to be WC Order ID

  if (!idParam) return NextResponse.json([]);

  const wcOrderId = idParam; 

  const siteUrl = process.env.WC_SITE_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  
  // 🔴🔴 کوکی سالم (از مرورگر بگیر) را حتماً اینجا بگذار 🔴🔴
  const myCookie = 'woodmart_wishlist_count=2; uap_test_cookie=1; _ga=GA1.1.804422083.1759411502; mp_a36067b00a263cce0299cfd960e26ecf_mixpanel=%7B%22distinct_id%22%3A%22%24device%3A978af268-a5dd-4e6c-b69c-bee7bad6f16a%22%2C%22%24device_id%22%3A%22978af268-a5dd-4e6c-b69c-bee7bad6f16a%22%2C%22%24initial_referrer%22%3A%22https%3A%2F%2Fpgemshop.com%2Fwp-admin%2Fplugins.php%22%2C%22%24initial_referring_domain%22%3A%22pgemshop.com%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%22%24initial_referrer%22%3A%22https%3A%2F%2Fpgemshop.com%2Fwp-admin%2Fplugins.php%22%2C%22%24initial_referring_domain%22%3A%22pgemshop.com%22%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%7D; woodmart_wishlist_hash=9ff111c47078b60ccfa4d8ae6165387a; wp-settings-2=libraryContent%3Dbrowse%26posts_list_mode%3Dlist%26editor%3Dtinymce%26advImgDetails%3Dshow%26hidetb%3D1%26imgsize%3Dfull%26align%3Dcenter%26editor_plain_text_paste_warning%3D1%26mfold%3D%26yithFwSidebarFold%3Do; wp-settings-time-2=1766389647; sbjs_migrations=1418474375998%3D1; sbjs_current_add=fd%3D2025-12-25%2007%3A23%3A33%7C%7C%7Cep%3Dhttps%3A%2F%2Fpgemshop.com%2F%7C%7C%7Crf%3Dhttps%3A%2F%2Fpgemshop.com%2F; sbjs_first_add=fd%3D2025-12-25%2007%3A23%3A33%7C%7C%7Cep%3Dhttps%3A%2F%2Fpgemshop.com%2F%7C%7C%7Crf%3Dhttps%3A%2F%2Fpgemshop.com%2F; sbjs_current=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29%7C%7C%7Cplt%3D%28none%29%7C%7C%7Cfmt%3D%28none%29%7C%7C%7Ctct%3D%28none%29; sbjs_first=typ%3Dtypein%7C%7C%7Csrc%3D%28direct%29%7C%7C%7Cmdm%3D%28none%29%7C%7C%7Ccmp%3D%28none%29%7C%7C%7Ccnt%3D%28none%29%7C%7C%7Ctrm%3D%28none%29%7C%7C%7Cid%3D%28none%29%7C%7C%7Cplt%3D%28none%29%7C%7C%7Cfmt%3D%28none%29%7C%7C%7Ctct%3D%28none%29; sbjs_udata=vst%3D1%7C%7C%7Cuip%3D%28none%29%7C%7C%7Cuag%3DMozilla%2F5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F143.0.0.0%20Safari%2F537.36; _clck=1x6mdn5%5E2%5Eg25%5E0%5E2101; wordpress_test_cookie=WP%20Cookie%20check; wordpress_logged_in_b52ec49a7c2de7af03daa5ec45587e2c=Hamedhajimohammadi%7C1766821540%7CFy5EsXaLjOOwPWHQELPJgPVNS1dmqOQyqZPCvIXUZso%7Cbdc4809911c18d1e7eba33d58eb178fb9db897b2a93ea9d56a1ae5125b2f662c; wp_woocommerce_session_b52ec49a7c2de7af03daa5ec45587e2c=2%7C%7C1766822820%7C%7C1766819220%7C%7Ce1ea01f0528ecfbceea1d8a8b804d48a; woodmart_recently_viewed_products=10183%7C10183%7C843; _ga_LBPT6DC1WN=GS2.1.s1766647413$o128$g1$t1766651248$j57$l0$h0; sbjs_session=pgs%3D15%7C%7C%7Ccpg%3Dhttps%3A%2F%2Fpgemshop.com%2F; _clsk=1fvdh67%5E1766651249266%5E16%5E1%5Ek.clarity.ms%2Fcollect; Human=12176665245917:212.252.133.131';

  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cookie': myCookie, 
  };

  // 1. Fetch WC Notes
  let wcNotes = [];
  try {
    const response = await fetch(`${siteUrl}/wp-json/wc/v3/orders/${wcOrderId}/notes`, {
      headers: headers,
      cache: 'no-store',
    });
    if (response.ok) {
        wcNotes = await response.json();
    }
  } catch (error) {
    console.error("WC Notes Fetch Error:", error);
  }

  // 2. Fetch DB Logs & Order Info
  let dbLogs = [];
  let orderInfo = null;

  try {
    // Try to find by wp_order_id (BigInt)
    // Note: Prisma BigInt requires special handling if we were sending it back directly, but we are mapping it.
    const order = await prisma.order.findUnique({
        where: { wp_order_id: BigInt(wcOrderId) },
        include: { logs: true }
    });

    if (order) {
        orderInfo = order;
        dbLogs = order.logs;
    }
  } catch(e) { 
      console.error("DB Fetch Error:", e); 
  }

  // 3. Merge & Normalize
  const timeline = [];

  // A. Order Creation
  if (orderInfo) {
      timeline.push({
          id: 'created',
          type: 'created',
          date: orderInfo.order_date,
          author: 'سیستم',
          message: 'سفارش در سیستم ثبت شد',
          icon: '🎉',
          color: 'bg-green-100 text-green-700 border-green-200'
      });
  }

  // B. WC Notes
  wcNotes.forEach(note => {
      // Clean HTML tags from note
      const cleanNote = note.note.replace(/<[^>]*>?/gm, '');
      
      timeline.push({
          id: `wc-${note.id}`,
          type: 'note',
          date: note.date_created,
          author: note.author === 'WooCommerce' ? 'سیستم' : note.author,
          message: cleanNote,
          is_customer_note: note.customer_note,
          icon: note.customer_note ? '👤' : '💬',
          color: note.customer_note ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'
      });
  });

  // C. DB Logs
  dbLogs.forEach(log => {
      let msg = log.description || log.action;
      let icon = '📝';
      let color = 'bg-gray-100 text-gray-700 border-gray-200';
      
      if (log.action === 'STATUS_CHANGE') {
          const statusMap = {
              'pending': 'در انتظار',
              'processing': 'در حال انجام',
              'completed': 'تکمیل شده',
              'on-hold': 'نگه داشته شده',
              'cancelled': 'لغو شده',
              'refunded': 'مسترد شده',
              'failed': 'ناموفق',
              'refund-req': 'درخواست استرداد'
          };
          const oldS = statusMap[log.old_status] || log.old_status;
          const newS = statusMap[log.new_status] || log.new_status;
          
          msg = `تغییر وضعیت: ${oldS} ⬅️ ${newS}`;
          icon = '🔄';
          color = 'bg-purple-100 text-purple-700 border-purple-200';
      } else if (log.action === 'ASSIGN_OPERATOR') {
          msg = `اختصاص به اپراتور: ${log.admin_name}`;
          icon = '👨‍💻';
          color = 'bg-indigo-100 text-indigo-700 border-indigo-200';
      } else if (log.action === 'NOTE_ADDED') {
          msg = `یادداشت داخلی: ${log.description}`;
          icon = '🗒️';
      } else if (log.action === 'پیام مشتری' || log.action === 'telegram_message') {
          msg = log.description;
          icon = '📩';
          color = 'bg-green-100 text-green-800 border-green-200';
      }

      timeline.push({
          id: `log-${log.id}`,
          type: 'log',
          date: log.created_at,
          author: log.admin_name || 'Admin',
          message: msg,
          icon: icon,
          color: color
      });
  });

  // 4. Sort by Date (Oldest First)
  timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

  return NextResponse.json(timeline);
}

export async function POST(req) {
  try {
    const { orderId, note } = await req.json();

    if (!orderId || !note) {
      return NextResponse.json({ error: 'Missing orderId or note' }, { status: 400 });
    }

    // Get current user (admin) - In a real app, get from session
    // For now, we'll use a placeholder or try to get it if possible, 
    // but since this is a simple route, we might just say 'Admin'
    // Ideally we should use the session to get the admin name.
    // Let's assume 'Admin' for now or check if we can get it from cookies/headers if implemented.
    const adminName = 'Admin'; 

    await prisma.orderLog.create({
      data: {
        order_id: parseInt(orderId),
        action: 'NOTE_ADDED',
        admin_name: adminName,
        description: note
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
