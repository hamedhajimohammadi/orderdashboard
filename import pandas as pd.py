import pandas as pd
from woocommerce import API
import time

# 1. تنظیمات ووکامرس (کلیدها را از ووکامرس > پیکربندی > پیشرفته > REST API بگیر)
wcapi = API(
    url="https://pgemshop.com",  # آدرس سایت
    consumer_key="ck_629b6752b3c46c05c5a9d1ef66b2f52055ce51fb",
    consumer_secret="cs_d00f5e84afaf476c07d20aa32ca0d94c429ae26f",
    version="wc/v3",
    timeout=20
)


# 2. خواندن فایل CSV
try:
    # فرض بر این است که فایل customers.csv کنار همین اسکریپت است
    df = pd.read_csv('customers.csv')
    print(f"📂 فایل خوانده شد. تعداد کل ردیف‌ها: {len(df)}")
except Exception as e:
    print(f"❌ خطا در خواندن فایل CSV: {e}")
    exit()

# 3. حلقه برای آپدیت تک‌تک سفارش‌ها
count_success = 0
count_fail = 0

for index, row in df.iterrows():
    order_id = row.get('order_id') or row.get('number') # ستون order_id یا number
    chat_id = row.get('chat_id')

    # تبدیل به رشته و حذف اعشار احتمالی
    if pd.isna(chat_id) or chat_id == '':
        continue
        
    chat_id = str(int(float(chat_id))) # تبدیل مثلا 123.0 به "123"
    order_id = str(int(float(order_id)))

    print(f"🔄 در حال آپدیت سفارش #{order_id} با چت آیدی: {chat_id} ...")

    data = {
        "meta_data": [
            {
                "key": "_telegram_chat_id",
                "value": chat_id
            },
            # اگر نام کاربری هم در csv هست و می‌خواهی ذخیره کنی:
            # { "key": "_telegram_username", "value": row.get('tg_username') }
        ]
    }

    try:
        response = wcapi.put(f"orders/{order_id}", data)
        if response.status_code == 200:
            print(f"✅ سفارش #{order_id} با موفقیت آپدیت شد.")
            count_success += 1
        else:
            print(f"⚠️ خطا در سفارش #{order_id}: {response.status_code} - {response.text}")
            count_fail += 1
    except Exception as e:
        print(f"❌ خطای اتصال برای سفارش #{order_id}: {e}")
        count_fail += 1
    
    # وقفه کوتاه برای جلوگیری از فشار به سرور
    time.sleep(0.5)

print("\n===================================")
print(f"🎉 پایان عملیات.")
print(f"✅ موفق: {count_success}")
print(f"❌ ناموفق: {count_fail}")