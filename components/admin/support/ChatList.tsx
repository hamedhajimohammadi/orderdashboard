'use client';
import { useEffect, useState } from 'react';
import { User, MessageCircle } from 'lucide-react';

export default function ChatList({ selectedId, onSelect, initialOrderId }: { selectedId: number | null, onSelect: (id: number, orderId: number | null) => void, initialOrderId: number | null }) {
    const [conversations, setConversations] = useState<any[]>([]);
    
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await fetch('/api/admin/support/conversations');
                if(res.ok) {
                    const data = await res.json();
                    const list = data.conversations || [];
                    setConversations(list);

                    // Auto-select based on initialOrderId
                    if (initialOrderId && !selectedId) {
                        const target = list.find((c: any) => c.order_id === initialOrderId);
                        if (target) {
                            onSelect(target.id, target.order_id);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        
        fetchChats();
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-gray-100 sticky top-0 z-10">
                <h2 className="font-bold text-gray-700 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    گفتگوها
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 && (
                    <p className="text-center text-gray-400 mt-10 text-sm">پیامی یافت نشد</p>
                )}
                {conversations.map((chat: any) => {
                    const lastMsg = chat.messages?.[0];
                    const isActive = selectedId === chat.id;
                    const isUnread = chat.status === 'WAITING_FOR_ADMIN' || (lastMsg?.sender === 'USER' && !lastMsg?.is_read);

                    return (
                        <div 
                            key={chat.id}
                            onClick={() => onSelect(chat.id, chat.order_id)}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all
                                ${isActive ? 'bg-white border-r-4 border-r-blue-500 shadow-sm' : ''}
                                ${isUnread ? 'bg-blue-50/50' : ''}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm ${isUnread ? 'font-black text-gray-900' : 'font-semibold text-gray-700'}`}>
                                    {chat.user_id ? `کاربر #${chat.user_id}` : `مهمان ${chat.id}`}
                                </span>
                                <span className="text-xs text-gray-400 dir-ltr">
                                    {new Date(chat.updated_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            
                            <p className={`text-sm truncate leading-6 ${isUnread ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                {lastMsg ? lastMsg.content : '(بدون پیام)'}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                                {chat.order ? (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded border border-gray-200">
                                        سفارش #{chat.order.wp_order_id.toString()}
                                    </span>
                                ) : <span></span>}
                                {isUnread && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
