// فایل: app/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // درخواست به API داخلی که در مرحله ۱ درست کردیم
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'خطا در ورود');
      }

      // ذخیره و هدایت به پنل
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      if (data.user.role === 'supervisor') {
        router.push('/supervisor');
      } else {
        router.push('/admin/users');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">ورود به پنل</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-center text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="نام کاربری"
            className="w-full p-3 border rounded-lg text-left outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
          <input 
            type="password" 
            placeholder="رمز عبور"
            className="w-full p-3 border rounded-lg text-left outline-none focus:ring-2 focus:ring-blue-500"
            dir="ltr"
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition">
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
      </div>
    </div>
  );
}