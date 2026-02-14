
'use client';
import { useState, useEffect } from 'react';
import { Activity, User, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function ActivityStream() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/supervisor/activity-logs');
        const data = await res.json();
        if (data.success) setLogs(data.data);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 15000); // هر ۱۵ ثانیه
    return () => clearInterval(interval);
  }, []);

  const getIcon = (action) => {
    switch (action) {
      case 'change_status': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pin_order': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'assign_order': return <User className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-full">
      <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-indigo-600" />
        فید زنده فعالیت‌ها
      </h3>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 items-start text-sm border-b border-gray-50 pb-3 last:border-0">
            <div className="mt-1 bg-gray-50 p-1.5 rounded-full">
              {getIcon(log.action)}
            </div>
            <div>
              <p className="text-gray-700">
                <span className="font-bold text-gray-900">{log.admin_name || 'سیستم'}</span>
                {' '}
                {log.description}
                {' '}
                <span className="text-gray-400 text-xs">
                  (#{log.order?.wp_order_id || log.order_id})
                </span>
              </p>
              <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {new Date(log.created_at).toLocaleTimeString('fa-IR')}
              </span>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">هنوز فعالیتی ثبت نشده است.</p>
        )}
      </div>
    </div>
  );
}
