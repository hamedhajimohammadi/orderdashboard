
'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, Save } from 'lucide-react';

export default function MarginsManager() {
  const [margins, setMargins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchMargins = async () => {
    setLoading(true);
    const res = await fetch('/api/finance/margins');
    const data = await res.json();
    if (data.success) {
      setMargins(data.data);
      setHasChanges(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMargins();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/finance/margins/sync', { method: 'POST' });
      await fetchMargins();
    } catch (e) {
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleMarginChange = (id, newValue) => {
    setMargins(margins.map(m => 
      m.id === id ? { ...m, margin_percent: newValue } : m
    ));
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updates = margins.map(m => 
        fetch('/api/finance/margins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wc_id: m.wc_id, margin_percent: m.margin_percent })
        })
      );
      
      await Promise.all(updates);
      setHasChanges(false);
    } catch (e) {
      console.error(e);
      alert('خطا در ذخیره تغییرات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 text-lg">تنظیم سود دسته‌بندی‌ها</h3>
        <div className="flex gap-2">
          <button 
            onClick={handleSaveAll}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition disabled:opacity-50 ${
              hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md' : 'bg-gray-100 text-gray-400'
            }`}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            ثبت تغییرات
          </button>
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-100 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> 
            {syncing ? 'در حال دریافت...' : 'بروزرسانی'}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {margins.map(margin => (
          <div key={margin.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <span className="font-medium text-gray-700">{margin.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">درصد سود:</span>
              <input 
                type="number" 
                value={margin.margin_percent}
                onChange={(e) => handleMarginChange(margin.id, e.target.value)}
                className="w-20 p-2 rounded-lg border text-center font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>
        ))}
        {margins.length === 0 && !loading && (
          <div className="text-center text-gray-400 py-10">
            هنوز دسته‌بندی‌ها دریافت نشده‌اند. دکمه بروزرسانی را بزنید.
          </div>
        )}
      </div>
    </div>
  );
}
