
export async function addWooCommerceNote(wpOrderId: bigint | string, note: string, isCustomerNote: boolean = true) {
    const siteUrl = process.env.WC_SITE_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    if (!siteUrl || !key || !secret) {
        console.warn("⚠️ تنظیمات ووکامرس در .env کامل نیست، یادداشت ارسال نشد.");
        return;
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
        console.log(`📝 Adding Note to Order #${wpOrderId}: ${note}`);
        const res = await fetch(`${siteUrl}/wp-json/wc/v3/orders/${wpOrderId}/notes`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            body: JSON.stringify({ 
                note: note,
                customer_note: isCustomerNote 
            }),
            cache: 'no-store',
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("❌ WooCommerce Note Failed:", err);
        } else {
            console.log("✅ WooCommerce Note Added Successfully");
        }
    } catch (e) {
        console.error("❌ Network Error Adding Note:", e);
    }
}

export async function updateWooCommerceStatus(wpOrderId: bigint | string, dashboardStatus: string) {
    let siteUrl = process.env.WC_SITE_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    if (!siteUrl || !key || !secret) {
        console.warn("⚠️ تنظیمات ووکامرس (WC_SITE_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET) کامل نیست.");
        return false;
    }

    // 🛠️ Status Mapping (Dashboard -> Site)
    const statusMap: Record<string, string> = {
        // 'completed': 'accepted',           // 1. تکمیل شده (غیرفعال شد تا استاندارد ارسال شود)
        'completed': 'completed',
        'failed': 'failed',                // 2. رد شده (استاندارد)
        'cancelled': 'cancelled',          // 3. لغو شده (استاندارد)
        'refunded': 'refunded',            // 4. مسترد شده
        'waiting': 'inOrder',              // 5. آماده انجام (کاستوم)
        'processing': 'processing',        // 6. در حال انجام (استاندارد)
        'wrong-info': 'wrong-info',        // 7. اطلاعات اشتباه
        'wrong_info': 'wrong-info',
        'need-verification': 'need-verification', // 8. نیاز به احراز
        'wc-awaiting-auth': 'need-verification',
        'refund-req': 'pending-refund',    // 9. در انتظار استرداد
        'awaiting-refund': 'pending-refund',
        'pending': 'pending',              // 10. در انتظار بررسی (استاندارد)
        'on-hold': 'on-hold',
    };

    // Remove 'wc-' prefix if present
    const cleanStatus = dashboardStatus.replace('wc-', '');
    const targetStatus = statusMap[cleanStatus] || cleanStatus;

    siteUrl = siteUrl.replace(/\/$/, "");
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    const makeRequest = async (attempt = 1): Promise<boolean> => {
        try {
            console.log(`🔄 Syncing Order #${wpOrderId} | Dashboard: ${dashboardStatus} -> Site: ${targetStatus} | Attempt: ${attempt}`);
            
            const res = await fetch(`${siteUrl}/wp-json/wc/v3/orders/${wpOrderId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
                },
                body: JSON.stringify({ 
                    status: targetStatus
                }),
                cache: 'no-store',
            });

            if (!res.ok) {
            const err = await res.text();
            console.error(`❌ WC API Sync Failed (Status: ${res.status}):`, err.substring(0, 200));
            return false;
        } else {
            // Check if response is JSON
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                console.log(`✅ WC API Updated Successfully: #${wpOrderId} -> ${data.status}`);
                return true;
            } else {
                const text = await res.text();
                console.error(`❌ WC API returned non-JSON (Status: ${res.status}):`, text.substring(0, 200));
                return false;
            }
        }
    } catch (e) {
        console.error(`❌ Network Error Syncing WC API (Attempt ${attempt}):`, e);
        if (attempt < 3) {
            const delay = 2000 * attempt;
            await new Promise(r => setTimeout(r, delay));
            return makeRequest(attempt + 1);
        }
        return false;
    }
};

return await makeRequest();
}

export async function getWooCommerceOrdersBatch(orderIds: string[]) {
let siteUrl = process.env.WC_SITE_URL;
const key = process.env.WC_CONSUMER_KEY;
const secret = process.env.WC_CONSUMER_SECRET;

if (!siteUrl || !key || !secret) return [];

siteUrl = siteUrl.replace(/\/$/, "");
const auth = Buffer.from(`${key}:${secret}`).toString('base64');

try {
    const params = new URLSearchParams();
    params.append('include', orderIds.join(','));
    params.append('per_page', '100'); 

    const res = await fetch(`${siteUrl}/wp-json/wc/v3/orders?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        cache: 'no-store',
    });

    if (!res.ok) return [];
    
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } else {
        const text = await res.text();
        console.error(`❌ WC API Batch Fetch returned non-JSON (Status: ${res.status}):`, text.substring(0, 200));
        return [];
    }
} catch (e) {
    console.error("❌ Error fetching batch orders from WC:", e);
    return [];
}
}

export async function searchProducts(query: string) {
  let siteUrl = process.env.WC_SITE_URL;
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;

  if (!siteUrl || !key || !secret) return [];

  siteUrl = siteUrl.replace(/\/$/, "");
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');

  try {
    const res = await fetch(`${siteUrl}/wp-json/wc/v3/products?search=${encodeURIComponent(query)}&per_page=5`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.map((p: any) => ({
      name: p.name,
      price: p.price,
      permalink: p.permalink
    }));
  } catch (e) {
    console.error("Error searching products:", e);
    return [];
  }
}
