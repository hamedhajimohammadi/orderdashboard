'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit2, Ban, ShieldAlert, CheckCircle, Wallet, Target, Trophy, Trash2 } from 'lucide-react';
import UserModal from '@/components/admin/UserModal';

type User = {
  id: number;
  username: string;
  display_name: string;
  role: string;
  avatar_url: string;
  daily_quota: number;
  bonus_rate: number;
  base_salary: number;
  is_banned: boolean;
};

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. بررسی لاگین (اگر توکن نبود برو بیرون)
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) router.push('/login');
    else fetchUsers();
  }, [router]);

  // 2. دریافت اطلاعات از API داخلی خودمان
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users'); // آدرس جدید
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      setUsers(result);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      setUsers(result);
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleBan = async (user: User) => {
    if (!confirm(`وضعیت کاربر تغییر کند؟`)) return;

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, is_banned: !user.is_banned }),
      });
      const result = await res.json();
      if (res.ok) setUsers(result);
    } catch (err) {
      alert('Error');
    }
  };

  // ✅ (جدید) حذف کاربر
  const handleDelete = async (user: User) => {
    // جلوگیری از حذف ادمین اصلی در فرانت
    if (user.username === 'admin') {
      alert('مدیر اصلی سیستم قابل حذف نیست.');
      return;
    }

    if (
      !confirm(
        `آیا مطمئن هستید که می‌خواهید "${user.display_name}" را برای همیشه حذف کنید؟\nاین عملیات غیرقابل بازگشت است.`
      )
    )
      return;

    try {
      const res = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      setUsers(result); // لیست را آپدیت کن
    } catch (err: any) {
      alert(err.message || 'خطا در حذف کاربر');
    }
  };

  const formatMoney = (amount: number) => {
    if (!amount) return '-';
    return (amount / 1000000).toLocaleString() + ' M';
  };

  // ✅ 1) تشخیص متن فارسی نقش
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'مدیر کل';
      case 'supervisor':
        return 'سوپروایزر';
      default:
        return 'ادمین سفارش';
    }
  };

  // ✅ 2) تشخیص رنگ نقش
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrator':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'supervisor':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const openAddModal = () => {
    setSelectedUser(undefined);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">مدیریت پرسنل</h1>
          <p className="text-gray-500 mt-2 text-sm">مشاهده عملکرد، مدیریت حقوق و سطح دسترسی ادمین‌ها</p>
        </div>
        <button
          onClick={openAddModal}
          className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-medium">افزودن عضو جدید</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex items-center gap-3">
          <ShieldAlert size={24} /> <span className="font-medium">{error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className={`group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${
                user.is_banned ? 'grayscale opacity-80' : ''
              }`}
            >
              {/* Actions Overlay */}
              <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {/* ویرایش */}
                <button
                  onClick={() => openEditModal(user)}
                  className="p-2 bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm border border-gray-200 transition"
                  title="ویرایش"
                >
                  <Edit2 size={16} />
                </button>

                {/* بن/آن‌بن */}
                <button
                  onClick={() => toggleBan(user)}
                  className={`p-2 bg-white rounded-lg shadow-sm border border-gray-200 transition ${
                    user.is_banned ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'
                  }`}
                  title={user.is_banned ? 'فعال سازی' : 'مسدود کردن'}
                >
                  {user.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                </button>

                {/* ✅ حذف دائمی */}
                {user.username !== 'admin' && (
                  <button
                    onClick={() => handleDelete(user)}
                    className="p-2 text-red-500 hover:bg-red-50 hover:border-red-200 bg-white border border-gray-200 rounded-lg shadow-sm transition"
                    title="حذف دائمی"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={`https://ui-avatars.com/api/?name=${user.username}&background=random`}
                      alt={user.display_name}
                      className="w-16 h-16 rounded-2xl object-cover shadow-md"
                    />
                    <span className={`absolute -bottom-1 -right-1 flex h-4 w-4`}>
                      <span
                        className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white ${
                          user.is_banned ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      ></span>
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-900 text-lg truncate pl-2">{user.display_name}</h3>

                      <span
                        className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold border ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 font-mono mt-0.5" dir="ltr">
                      @{user.username}
                    </p>
                  </div>
                </div>

                {user.is_banned && (
                  <div className="mt-4 bg-red-50 text-red-600 text-xs font-bold px-3 py-2 rounded-lg flex items-center justify-center gap-2">
                    <ShieldAlert size={14} /> دسترسی مسدود است
                  </div>
                )}
              </div>

              {/* Stats Footer */}
              <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 grid grid-cols-3 divide-x divide-x-reverse divide-gray-200 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <Target size={10} /> تارگت
                  </div>
                  <div className="font-bold text-gray-800 text-sm">{user.daily_quota || '-'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <Trophy size={10} /> پاداش
                  </div>
                  <div className="font-bold text-gray-800 text-sm">
                    {user.bonus_rate ? user.bonus_rate / 1000 + 'k' : '-'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 mb-1 flex items-center justify-center gap-1">
                    <Wallet size={10} /> حقوق
                  </div>
                  <div className="font-bold text-gray-800 text-sm">{formatMoney(user.base_salary)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Component */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={modalMode === 'add' ? handleCreate : handleUpdate}
        initialData={selectedUser}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
