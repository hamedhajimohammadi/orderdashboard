
'use client';
import { useState, useEffect } from 'react';
import { Send, Save, MessageCircle } from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [chatId, setChatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    // دریافت اطلاعات کاربر فعلی
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.data);
          setChatId(data.data.telegram_chat_id || '');
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_chat_id: chatId })
      });
      if (res.ok) {
        alert('تنظیمات ذخیره شد');
      } else {
        alert('خطا در ذخیره');
      }
    } catch (e) {
      alert('خطا در ارتباط با سرور');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/admin/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId })
      });
      const data = await res.json();
      if (data.success) {
        alert('پیام تست ارسال شد. تلگرام خود را چک کنید.');
      } else {
        alert('خطا در ارسال پیام: ' + (data.message || 'Unknown error'));
      }
    } catch (e) {
      alert('خطا در ارتباط');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="p-10">در حال بارگذاری...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <h1 className="text-2xl font-black text-gray-800 mb-8">تنظیمات سیستم</h1>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-700 mb-6 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-500" />
          اتصال به تلگرام (برای دریافت اعلان‌ها)
        </h2>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 leading-relaxed">
            <p className="font-bold mb-2">راهنما:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>در تلگرام ربات <b>@userinfobot</b> را استارت کنید.</li>
              <li>عدد Id که به شما می‌دهد را کپی کنید.</li>
              <li>آن را در کادر زیر وارد کنید و ذخیره را بزنید.</li>
              <li>سپس دکمه "تست اتصال" را بزنید تا مطمئن شوید ربات ما می‌تواند به شما پیام دهد.</li>
              <li>(نکته: باید ربات اختصاصی سیستم را هم استارت کرده باشید)</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Telegram Chat ID</label>
            <input 
              type="text" 
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full p-3 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left"
              placeholder="Example: 123456789"
              dir="ltr"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition"
            >
              <Save className="w-5 h-5" />
              ذخیره تنظیمات
            </button>

            <button 
              onClick={handleTest}
              disabled={testing || !chatId}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {testing ? 'در حال ارسال...' : 'تست اتصال'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
