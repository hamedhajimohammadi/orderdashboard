'use client';
import { useEffect, useState } from 'react';
import ChatWindow from '@/components/admin/support/ChatWindow'; // Assuming correct path

// Added conversationId optional prop to skip fetching
export default function OrderChatPanel({ orderId, userId, conversationId: incomeId }: { orderId?: number, userId?: number, conversationId?: number }) {
    const [conversationId, setConversationId] = useState<number | null>(incomeId || null);
    const [loading, setLoading] = useState(!incomeId);

    useEffect(() => {
        if (incomeId) {
             setConversationId(incomeId);
             setLoading(false);
             return;
        }
        if (!orderId) return;

        const fetchConversation = async () => {
             try {
                // Use the generic history endpoint filtering by orderId
                const res = await fetch(`/api/chat/history?orderId=${orderId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.conversations && data.conversations.length > 0) {
                        // Use the most recent conversation
                        setConversationId(data.conversations[0].id);
                    } else {
                        setConversationId(null);
                    }
                }
             } catch (e) {
                 console.error(e);
             } finally {
                 setLoading(false);
             }
        };
        fetchConversation();
    }, [orderId]);

    const handleCreateConversation = async () => {
        try {
             // Create a new conversation explicitly linked to this order
             // The system message acts as initialization
             const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: 'گفتگو توسط پشتیبانی برای این سفارش ایجاد شد.', // Localized system message
                    orderId: orderId,
                    userId: userId,
                    sender: 'SYSTEM' // Important: System sender
                })
             });
             const data = await res.json();
             if (data.success && data.conversationId) {
                 setConversationId(data.conversationId);
             }
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full text-gray-400">در حال دریافت اطلاعات...</div>;

    if (!conversationId) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300 m-4">
                <p>هنوز گفتگویی برای این سفارش وجود ندارد.</p>
                <button 
                    onClick={handleCreateConversation}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                    <span>💬</span>
                    شروع گفتگو
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <ChatWindow conversationId={conversationId} />
        </div>
    );
}
