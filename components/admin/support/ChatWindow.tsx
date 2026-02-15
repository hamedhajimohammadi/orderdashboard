'use client';
import { useEffect, useState, useRef } from 'react';
import { Send, User, Bot, Crown, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';

export default function ChatWindow({ conversationId }: { conversationId: number }) {
    const { currentUser } = useOrderStore();
    const [messages, setMessages] = useState<any[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const [showTransferMenu, setShowTransferMenu] = useState(false);
    const [admins, setAdmins] = useState<any[]>([]);
    const endRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [input, setInput] = useState('');

    // Fetch messages periodically
    const fetchMessages = async () => {
        if (!conversationId) return;
        try {
            const res = await fetch(`/api/admin/support/messages?conversationId=${conversationId}`);
            if(res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                if (data.conversation) setConversation(data.conversation);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        setMessages([]); // Clear on switch
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [conversationId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!input.trim() || loading) return;
        
        const content = input;
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/support/reply', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ conversationId, content })
            });
            
            if (res.ok) {
                await fetchMessages();
            } else {
                setInput(content); // Restore on error
            }
        } catch (e) {
            console.error(e);
            setInput(content);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (targetId: number | null) => {
        try {
            const res = await fetch('/api/admin/support/assign', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ conversationId, assigneeId: targetId })
            });
            if (res.ok) {
                fetchMessages();
                setShowTransferMenu(false);
            }
        } catch (e) {
            console.error(e);
        }
    };
    
    const fetchAdmins = async () => {
        // We'll implement this endpoint later or mock it
        // For now let's assume we can get users list
        // Maybe fetch('/api/admin/users?role=administrator')
        const res = await fetch('/api/admin/users/list'); // Need to create this or use existing
        if (res.ok) {
            const data = await res.json();
            setAdmins(data.users.filter((u:any) => u.role === 'administrator' && u.id !== currentUser?.id) || []);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
            {/* Header / Toolbar */}
            <div className="bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm z-10">
                 <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">وضعیت:</span>
                    {conversation?.assignee ? (
                        <span className={`text-xs px-2 py-1 rounded-full ${conversation.assignee.id === currentUser?.id ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {conversation.assignee.id === currentUser?.id 
                                ? 'در دست شما' 
                                : `در دست ${conversation.assignee.display_name || conversation.assignee.first_name}`}
                        </span>
                    ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">آزاد</span>
                    )}
                 </div>

                 <div className="flex gap-2">
                    {!conversation?.assignee_id && (
                        <button 
                            onClick={() => handleAssign(currentUser?.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                        >
                            <CheckCircle size={14} />
                            برداشتن
                        </button>
                    )}
                    
                    {conversation?.assignee_id === currentUser?.id && (
                        <div className="relative">
                            <button 
                                onClick={() => { setShowTransferMenu(!showTransferMenu); if(!showTransferMenu) fetchAdmins(); }}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm flex items-center gap-1 border"
                            >
                                <ArrowRightLeft size={14} />
                                ارجاع
                            </button>
                            {showTransferMenu && (
                                <div className="absolute left-0 top-full mt-1 w-48 bg-white border rounded-lg shadow-lg py-1 z-20">
                                    {admins.length === 0 ? (
                                        <p className="px-4 py-2 text-xs text-gray-500">ادمین دیگری یافت نشد</p>
                                    ) : (
                                        admins.map(admin => (
                                            <button
                                                key={admin.id}
                                                onClick={() => handleAssign(admin.id)}
                                                className="block w-full text-right px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                                            >
                                                {admin.display_name || admin.first_name || 'Admin'}
                                            </button>
                                        ))
                                    )}
                                    <div className="border-t my-1"></div>
                                    <button 
                                        onClick={() => handleAssign(null)}
                                        className="block w-full text-right px-4 py-2 text-sm hover:bg-red-50 text-red-600"
                                    >
                                        رها سازی (Unassign)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                 </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>هیچ پیامی وجود ندارد</p>
                    </div>
                )}
                
                {messages.map((msg) => {
                    const isMe = msg.sender === 'ADMIN';
                    return (
                        <div 
                            key={msg.id} 
                            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm relative group
                                ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}
                            `}>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                <span className={`text-[10px] absolute bottom-1 ${isMe ? 'left-2 text-blue-100' : 'right-2 text-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                                    {new Date(msg.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>

            {/* Canned Responses */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex gap-2 overflow-x-auto no-scrollbar">
                {[
                    "سلام، وقت بخیر 👋",
                    "لطفا کد ارسالی را بفرستید 📩",
                    "منتظر تایید شما هستیم ⏳",
                    "انجام شد ✅",
                    "با تشکر، خدانگهدار 🙏"
                ].map((text, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setInput(prev => prev + text)}
                        className="text-xs bg-white text-gray-600 px-3 py-1.5 rounded-full border border-gray-200 whitespace-nowrap hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition shadow-sm"
                    >
                        {text}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 flex gap-2 items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                    disabled={loading}
                />
                <button 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                >
                    <Send className="w-5 h-5 rtl:rotate-180" />
                </button>
            </form>
        </div>
    );
}
