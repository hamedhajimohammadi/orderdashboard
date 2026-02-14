
'use client';
import { useState, useEffect } from 'react';
import { Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export default function StatsHUD() {
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    issues: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/supervisor/stats');
        const data = await res.json();
        if (data.success) setStats(data.data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Pending */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${stats.pending > 10 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
        <div>
          <p className="text-gray-500 text-xs font-bold mb-1">صف انتظار (امروز)</p>
          <p className={`text-2xl font-black ${stats.pending > 10 ? 'text-red-600' : 'text-gray-800'}`}>{stats.pending}</p>
        </div>
        <div className={`p-3 rounded-xl ${stats.pending > 10 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* Active */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs font-bold mb-1">در حال انجام</p>
          <p className="text-2xl font-black text-blue-600">{stats.active}</p>
        </div>
        <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
          <Zap className="w-6 h-6" />
        </div>
      </div>

      {/* Issues */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${stats.issues > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
        <div>
          <p className="text-gray-500 text-xs font-bold mb-1">مشکل‌دار (Issues)</p>
          <p className={`text-2xl font-black ${stats.issues > 0 ? 'text-amber-600' : 'text-gray-800'}`}>{stats.issues}</p>
        </div>
        <div className={`p-3 rounded-xl ${stats.issues > 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs font-bold mb-1">تکمیل شده (امروز)</p>
          <p className="text-2xl font-black text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-green-50 text-green-600 p-3 rounded-xl">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
