'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatList from '@/components/admin/support/ChatList';
import ChatWindow from '@/components/admin/support/ChatWindow';
import OrderDetails from '@/components/admin/support/OrderDetails';

export default function SupportPage() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId');

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const handleSelectConversation = (id: number, orderId: number | null) => {
      setSelectedConversationId(id);
      setSelectedOrderId(orderId);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-right" dir="rtl">
        {/* Right: Chat List */}
        <div className="w-1/4 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <ChatList 
                selectedId={selectedConversationId} 
                onSelect={handleSelectConversation} 
                initialOrderId={initialOrderId ? parseInt(initialOrderId) : null}
            />
        </div>

        {/* Center: Chat Window */}
        <div className="flex-1 flex flex-col bg-white border-l border-gray-200">
            {selectedConversationId ? (
                <ChatWindow conversationId={selectedConversationId} />
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p>یک گفتگو را انتخاب کنید</p>
                </div>
            )}
        </div>

        {/* Left: Order Details */}
        <div className="w-1/4 bg-white overflow-y-auto p-4">
             {selectedOrderId ? (
                 <OrderDetails orderId={selectedOrderId} />
             ) : (
                 <div className="text-center text-gray-400 mt-10">
                     <p className="text-sm">سفارش مرتبط یافت نشد</p>
                 </div>
             )}
        </div>
    </div>
  );
}
