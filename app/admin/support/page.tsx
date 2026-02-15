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
  const [view, setView] = useState<'list' | 'chat'>('list'); // Mobile view state

  const handleSelectConversation = (id: number, orderId: number | null) => {
      setSelectedConversationId(id);
      setSelectedOrderId(orderId);
      setView('chat'); // Switch to chat view on selection (for mobile)
  };

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-white md:rounded-2xl shadow-sm border border-gray-200 overflow-hidden text-right" dir="rtl">
        {/* Right: Chat List (Visible on Desktop OR when view is 'list' on Mobile) */}
        <div className={`w-full md:w-1/4 border-l border-gray-200 bg-gray-50 overflow-y-auto ${view === 'list' ? 'block' : 'hidden md:block'}`}>
            <ChatList 
                selectedId={selectedConversationId} 
                onSelect={handleSelectConversation} 
                initialOrderId={initialOrderId ? parseInt(initialOrderId) : null}
            />
        </div>

        {/* Center: Chat Window (Visible on Desktop OR when view is 'chat' on Mobile) */}
        <div className={`w-full md:flex-1 flex flex-col bg-white border-l border-gray-200 ${view === 'chat' ? 'block' : 'hidden md:flex'}`}>
            {/* Mobile Back Header */}
            <div className="md:hidden flex items-center p-2 bg-gray-50 border-b">
                <button onClick={() => setView('list')} className="flex items-center gap-1 text-gray-600 bg-white border rounded-lg px-3 py-1 text-sm shadow-sm">
                    <span className="text-lg">→</span> بازگشت
                </button>
            </div>

            {selectedConversationId ? (
                <ChatWindow conversationId={selectedConversationId} />
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p>یک گفتگو را انتخاب کنید</p>
                </div>
            )}
        </div>

        {/* Left: Order Details (Hidden on Mobile for now to save space, or can be a toggle) */}
        <div className="hidden md:block w-1/4 bg-white overflow-y-auto p-4">
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
