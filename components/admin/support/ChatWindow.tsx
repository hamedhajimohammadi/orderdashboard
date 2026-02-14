'use client';
import { useEffect, useState, useRef } from 'react';
import { Send, User, Bot, Crown } from 'lucide-react';

export default function ChatWindow({ conversationId }: { conversationId: number }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);

    // Fetch messages periodically
    const fetchMessages = async () => {
        if (!conversationId) return;
        try {
            const res = await fetch(`/api/admin/support/messages?conversationId=${conversationId}`);
            if(res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
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

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
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
