'use client';
import { X, UserCheck, Battery } from 'lucide-react';
import useSupervisorStore from '@/store/useSupervisorStore';

export default function AssignModal({ isOpen, onClose, selectedOrder }) {
  const admins = useSupervisorStore((state) => state.admins);
  const assignOrderToAdmin = useSupervisorStore((state) => state.assignOrderToAdmin);

  if (!isOpen || !selectedOrder) return null;

  const handleAssign = (adminId) => {
    assignOrderToAdmin(adminId, selectedOrder);
    onClose(); // بستن مودال بعد از انجام کار
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800">انتخاب ادمین مسئول</h3>
            <p className="text-xs text-gray-500 mt-1">
              برای سفارش: <span className="font-mono font-bold text-indigo-600">{selectedOrder.title}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* List of Available Admins */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
          {admins.map((admin) => {
            const emptySlots = admin.slots.filter(s => s === null).length;
            const isFull = emptySlots === 0;
            const isOnline = admin.status === 'online';

            return (
              <button
                key={admin.id}
                disabled={isFull || !isOnline}
                onClick={() => handleAssign(admin.id)}
                className={`
                  w-full flex items-center justify-between p-3 rounded-lg border transition-all
                  ${isFull || !isOnline 
                    ? 'opacity-50 bg-gray-50 cursor-not-allowed border-gray-100' 
                    : 'bg-white hover:border-indigo-500 hover:bg-indigo-50 hover:shadow-md cursor-pointer border-gray-200'}
                `}
              >
                <div className="flex items-center gap-3">
                  <img src={admin.avatar} alt={admin.name} className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="text-right">
                    <p className="font-bold text-sm text-gray-800">{admin.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      {isOnline ? <span className="text-green-600">آنلاین</span> : <span className="text-gray-400">آفلاین/مشغول</span>}
                    </p>
                  </div>
                </div>

                {/* Slot Capacity Indicator */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {admin.slots.map((s, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-4 rounded-sm ${s ? 'bg-gray-300' : 'bg-green-400'}`} 
                        title={s ? 'پر' : 'خالی'}
                      />
                    ))}
                  </div>
                  {isFull && <span className="text-[10px] text-red-500 font-bold">پر</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}