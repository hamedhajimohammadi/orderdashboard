"use client";
import { useState, useEffect, useRef } from "react";
import { useOrderStore } from "@/store/useOrderStore";
import SecurityCheckCard from "./SecurityCheckCard";
import OrderChatPanel from "@/components/admin/support/OrderChatPanel"; // Import the component

export default function FocusModal({ order, onClose }) {
  const { updateOrderStatus, releaseOrder, saveOrderNote, fetchOrderNotes, currentNotes, isLoadingNotes } = useOrderStore();
  
  const [note, setNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [sendToTelegram, setSendToTelegram] = useState(false); 
  const [isNotesExpanded, setIsNotesExpanded] = useState(false); 
  const [isSyncing, setIsSyncing] = useState(false); 
  const [showChat, setShowChat] = useState(true); // Default to true or persistent
  const [activeTab, setActiveTab] = useState('details'); // Mobile Tab: 'details' or 'chat'
  const [conversationId, setConversationId] = useState(null); // To store conversation ID if exists

  const notesEndRef = useRef(null);

  // ============================================================
  // 👇 استخراج ایمن داده‌ها (سازگار با دیتابیس جدید Prisma)
  // ============================================================
  const snapshot = order?.snapshot_data || {};
  
  // ۱. آیتم‌های سفارش
  const lineItems = snapshot.line_items || [];
  
  // ۲. اطلاعات مشتری
  const billing = snapshot.billing || {};
  const firstName = order?.user?.first_name || billing.first_name || "کاربر";
  const lastName = order?.user?.last_name || billing.last_name || "مهمان";
  const fullName = `${firstName} ${lastName}`;
  const phoneNumber = order?.user?.phone_number || billing.phone || "";
  
  // ۳. اطلاعات مالی و عمومی
  const orderNumber = order?.number || snapshot.number || order?.wp_order_id;
  const orderTotal = order?.final_payable || snapshot.total || 0;
  const paymentMethodTitle = order?.payment_method || snapshot.payment_method_title || "نامشخص";
  const orderDate = order?.date_created || snapshot.date_created || new Date().toISOString();
  
  const statusLabels = {
    'processing': 'در حال انجام',
    'completed': 'تکمیل شده',
    'refunded': 'مسترد شده',
    'cancelled': 'لغو شده',
    'failed': 'ناموفق',
    'on-hold': 'در انتظار بررسی',
    'pending': 'در انتظار پرداخت',
    'waiting': 'آماده انجام',
    'refund-req': 'درخواست استرداد',
    'wrong-info': 'اطلاعات اشتباه',
    'wrong_info': 'اطلاعات اشتباه',
    'need-verification': 'نیاز به احراز',
    'verification': 'نیاز به احراز',
    'awaiting-refund': 'در انتظار استرداد'
  };
  const statusLabel = statusLabels[order?.status] || order?.status;

  const hasTelegram = !!order?.user?.telegram_chat_id; // 📱 بررسی تلگرام
  
  // ============================================================

  useEffect(() => {
    // Use WC Order ID if available, otherwise internal ID (though API expects WC ID now)
    const effectiveId = order?.wp_order_id || order?.id;
    if (effectiveId) fetchOrderNotes(effectiveId);
    document.body.style.overflow = "hidden"; 
    return () => { document.body.style.overflow = "auto"; };
  }, [order]);

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentNotes]);

  // Loading conversation for this order
  useEffect(() => {
    if (order?.id) {
       const fetchConv = async () => {
         try {
           const res = await fetch(`/api/admin/support/conversations/by-order/${order.id}`);
           if (res.ok) {
             const data = await res.json();
             if (data.conversation) {
               setConversationId(data.conversation.id);
               // Auto pick up if free? Maybe optional.
             }
           }
         } catch (e) { console.error(e); }
       }
       fetchConv();
    }
  }, [order]);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text));
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/admin/sync-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wp_order_id: order.wp_order_id })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ سفارش با موفقیت همگام‌سازی شد.");
        onClose(); 
      } else {
        alert("❌ خطا در همگام‌سازی: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("❌ خطا در ارتباط با سرور");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveNote = async () => {
      if(!note.trim()) return;
      setIsSavingNote(true);

      // Use WC Order ID if available for refreshing notes
      const effectiveId = order?.wp_order_id || order?.id;

      if (sendToTelegram) {
          try {
              const res = await fetch('/api/admin/send-message', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: order.id, message: note })
              });
              const data = await res.json();
              if (data.success) {
                  // ثبت در نوت‌ها که پیام ارسال شد
                  await saveOrderNote(order.id, `📤 پیام تلگرام به مشتری: ${note}`, effectiveId);
              } else {
                  alert(data.message || "خطا در ارسال پیام تلگرام");
              }
          } catch (e) {
              console.error("Telegram Send Error:", e);
              alert(`خطا در ارتباط با سرور: ${e.message}`);
          }
      } else {
          await saveOrderNote(order.id, note, effectiveId);
      }

      setNote(""); 
      setIsSavingNote(false);
  };

  const handleStatusChange = (status) => {
    let confirmMsg = "آیا مطمئن هستید؟";
    if (status === 'completed') confirmMsg = "آیا سفارش را تکمیل می‌کنید؟ ✅";
    if (status === 'refunded') confirmMsg = "آیا سفارش را مسترد می‌کنید؟ ❌";
    if (status === 'refund-req') confirmMsg = "آیا درخواست استرداد وجه برای این سفارش ثبت شود؟ 💸";
    
    if(confirm(confirmMsg)) {
        updateOrderStatus(order.id, status, note);
        onClose();
    }
  };



  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm" dir="rtl">
      
      {/* 📱 کانتینر اصلی */}
      <div className="bg-gray-50 w-full h-full md:h-[95vh] md:max-w-6xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 font-sans">
        
        {/* هدر */}
        <div className="bg-white p-3 md:p-4 border-b flex justify-between items-center shadow-sm shrink-0">
            <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                <span className="bg-blue-100 text-blue-700 p-1.5 md:p-2 rounded-xl text-lg md:text-2xl">🎮</span>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm md:text-xl font-black text-gray-800 tracking-tight truncate">سفارش #{orderNumber}</h2>
                        {/* Desktop Toggle Button */}
                        <button 
                             onClick={() => setShowChat(!showChat)}
                             className={`hidden md:flex text-xs px-2 py-1 rounded-full border items-center gap-1 transition-colors ${showChat ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
                        >
                             💬 گفتگو
                        </button>
                        {hasTelegram && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                تلگرام
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-500 font-medium">{String(orderDate).replace('T', ' ')}</p>
                </div>
                <span className="mr-2 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                    {statusLabel}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleSync} 
                    disabled={isSyncing}
                    className={`bg-gray-100 hover:bg-blue-500 hover:text-white rounded-xl w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition text-lg ${isSyncing ? 'animate-spin' : ''}`}
                    title="همگام‌سازی مجدد با سایت"
                >
                    🔄
                </button>
                <button onClick={onClose} className="bg-gray-100 hover:bg-red-500 hover:text-white rounded-xl w-8 h-8 md:w-10 md:h-10 flex items-center justify-center transition text-lg">✕</button>
            </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden border-b border-gray-200 bg-white">
            <button 
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-gray-500'}`}
            >
                📝 جزئیات سفارش
            </button>
            <button 
                onClick={() => { setActiveTab('chat'); setShowChat(true); }}
                className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors relative ${activeTab === 'chat' ? 'border-blue-600 text-blue-600 bg-blue-50/20' : 'border-transparent text-gray-500'}`}
            >
                💬 چت آنلاین
                {order?.user?.last_seen && (Date.now() - new Date(order.user.last_seen).getTime() < 300000) && (
                    <span className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full border border-white animate-pulse"></span>
                )}
            </button>
        </div>

        {/* بدنه اصلی */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">
            
            {/* Chat Panel - Only for Mobile Tab View */}
            {conversationId && activeTab === 'chat' && (
                <div className="md:hidden flex-1 flex flex-col w-full h-full bg-white z-20">
                    <OrderChatPanel conversationId={conversationId} />
                </div>
            )}

            {/* 🟦 ستون راست: محصولات (Web: Middle Column -> Now Right Column) */}
            <div className={`
                bg-white border-b md:border-b-0 md:border-l overflow-y-auto custom-scrollbar p-4 space-y-6 transition-all
                ${activeTab === 'details' ? 'flex-1 w-full block' : 'hidden md:block'}
                md:w-1/2
            `}>
                
                {/* ✅ استفاده از متغیر lineItems که امن است */}
                {lineItems.map((item, index) => {
                    const itemMeta = item.meta_data ? item.meta_data.filter(m => m.key && !m.key.startsWith('_') && m.key !== 'pa_platform') : [];

                    return (
                        <div key={item.id || index} className="relative">
                            {lineItems.length > 1 && (
                                <span className="absolute -right-2 -top-3 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-full shadow-md z-10">
                                    آیتم {index + 1}
                                </span>
                            )}

                            {/* کارت محصول */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl mb-3 text-center shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-200"></div>
                                <p className="font-extrabold text-blue-900 text-sm md:text-lg leading-relaxed">{item.name}</p>
                                <div className="mt-2 flex justify-center gap-2">
                                    <span className="text-[10px] font-bold text-blue-600 bg-white/60 py-1 px-2 rounded-lg border border-blue-100">
                                        تعداد: {item.quantity}
                                    </span>
                                </div>
                            </div>

                            {/* اطلاعات اکانت */}
                            {itemMeta.length > 0 ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="text-gray-400 text-[10px] font-bold flex items-center gap-1 pr-1">
                                            🔐 اطلاعات اکانت
                                        </h3>
                                        <button 
                                            onClick={() => copyToClipboard(itemMeta.map(m => m.value).join('\t'))}
                                            className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-600 hover:text-white transition border border-indigo-100 flex items-center gap-1"
                                            title="کپی نام کاربری و رمز عبور با فاصله Tab"
                                        >
                                            📋 کپی ایمیل:پسورد
                                        </button>
                                    </div>
                                    {itemMeta.map((meta, idx) => (
                                        <div key={idx} className="flex flex-col bg-gray-50 p-2 md:p-3 rounded-xl border border-gray-100 hover:border-blue-300 transition group">
                                            <span className="text-gray-500 text-[10px] font-bold mb-1">{meta.key}:</span>
                                            <div className="flex justify-between items-center gap-2">
                                                <code className="font-bold text-gray-800 text-xs md:text-sm dir-ltr font-mono select-all truncate flex-1" onClick={(e)=>e.target.select()}>
                                                    {meta.value}
                                                </code>
                                                <button onClick={() => copyToClipboard(meta.value)} className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-600 hover:text-white transition shrink-0">
                                                    کپی
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-[10px] text-gray-300 border border-dashed border-gray-100 rounded-xl p-2">
                                    بدون دیتای ورودی
                                </div>
                            )}

                            {index < lineItems.length - 1 && (
                                <div className="border-b-2 border-dashed border-gray-100 my-6 w-full relative"></div>
                            )}
                        </div>
                    );
                })}

                {/* Security Check Card */}
                <SecurityCheckCard order={order} />
            </div>

            {/* 🟧 ستون چپ: چت و یادداشت (Web: Left Column with Tabs) */}
            <div className={`w-full md:w-1/2 bg-gray-50 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isNotesExpanded ? 'h-[50vh] md:h-auto border-t-4 border-blue-100' : 'h-auto md:h-auto'}`}>
                
                {/* 🏷️ تب‌های دسکتاپ برای این ستون (چت آنلاین / یادداشت داخلی) */}
                <div className="hidden md:flex bg-white border-b border-gray-200 sticky top-0 z-10">
                    <button 
                        onClick={() => setShowChat(true)} 
                        className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors relative ${showChat ? 'border-green-500 text-green-700 bg-green-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                         💬 گفتگوی آنلاین
                         {order?.user?.last_seen && (Date.now() - new Date(order.user.last_seen).getTime() < 300000) && (
                             <span className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full border border-white animate-pulse"></span>
                         )}
                    </button>
                    <button 
                        onClick={() => setShowChat(false)} 
                        className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${!showChat ? 'border-blue-500 text-blue-700 bg-blue-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                         📝 یادداشت‌های داخلی
                    </button>
                </div>

                {/* 1. حالت چت آنلاین (Desktop Only here - Mobile uses separate tab) */}
                {showChat && conversationId ? (
                     <div className="flex-1 overflow-hidden hidden md:flex flex-col h-full bg-slate-100">
                        <OrderChatPanel conversationId={conversationId} />
                     </div>
                ) : null}

                {/* 2. حالت یادداشت‌های داخلی (وقتی چت بسته است یا موبایل) */}
                <div 
                    className={`${(showChat && conversationId) ? 'hidden' : 'flex'} md:${(!showChat || !conversationId) ? 'flex' : 'hidden'} flex-1 flex-col overflow-hidden relative bg-gray-50 h-full`}
                >
                {/* هدر موبایل برای اطلاعات مالی */}
                <div 
                    className="md:hidden bg-white px-4 py-2 border-b border-gray-100 flex justify-between items-center shrink-0 cursor-pointer active:bg-gray-50 transition sticky top-0 z-10"
                    onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                >
                    <div className="text-[10px] text-gray-500 flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span>👤 {fullName}</span>
                            
                            {/* Verification Badge */}
                            {order?.user?.is_verified ? (
                                <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5" title="هویت تایید شده">
                                    <span className="text-xs">✓</span> احراز شده
                                </span>
                            ) : (
                                <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5" title="هویت تایید نشده">
                                    <span className="text-xs">!</span> تایید نشده
                                </span>
                            )}

                            {phoneNumber && (
                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100" onClick={(e) => e.stopPropagation()}>
                                    <span className="font-mono font-bold text-amber-800 select-all text-xs">{phoneNumber}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); copyToClipboard(phoneNumber); }}
                                        className="text-amber-400 hover:text-amber-700 transition"
                                        title="کپی شماره تماس"
                                    >
                                        📋
                                    </button>
                                </div>
                            )}
                        </div>

                        <span className={`md:hidden text-[10px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 ${isNotesExpanded ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                            {isNotesExpanded ? 'بستن گفتگو ▼' : 'گفتگو و یادداشت ▲'}
                        </span>
                    </div>
                    <div className="flex gap-2 items-center">
                         <span className="font-bold text-emerald-600 text-sm">{parseInt(orderTotal).toLocaleString()} ت</span>
                         <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-400">{paymentMethodTitle}</span>
                    </div>
                </div>

                {/* چت باکس */}
                <div className={`${isNotesExpanded ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden relative bg-gray-50 h-full`}>
                    
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                        {currentNotes.length === 0 && !isLoadingNotes ? (
                            <div className="text-center text-gray-300 text-xs mt-4">هیچ رویدادی ثبت نشده است.</div>
                        ) : (
                            <div className="relative border-r-2 border-gray-200 mr-4 space-y-6 pr-6 py-2">
                                {currentNotes.map((n, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -right-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center z-10">
                                            <div className={`w-2 h-2 rounded-full ${n.type === 'created' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        </div>

                                        <div className={`flex flex-col gap-1 ${n.author === 'سیستم' ? 'opacity-80' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-gray-400 font-mono">
                                                    {new Date(n.date).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit', timeZone: 'Asia/Tehran'})}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-500">
                                                    {new Date(n.date).toLocaleDateString('fa-IR', {timeZone: 'Asia/Tehran'})}
                                                </span>
                                                <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                                    {n.author}
                                                </span>
                                            </div>

                                            <div className={`p-3 rounded-xl text-xs md:text-sm shadow-sm border relative group transition hover:shadow-md
                                                ${n.color || 'bg-white text-gray-700 border-gray-200'}
                                            `}>
                                                <div className="absolute -right-2 top-2 w-2 h-2 bg-inherit transform rotate-45 border-t border-r border-inherit"></div>
                                                <div className="flex items-start gap-2">
                                                    <span className="text-lg select-none">{n.icon}</span>
                                                    <p className="leading-relaxed whitespace-pre-wrap">{n.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div ref={notesEndRef} />
                    </div>

                    {/* ورودی متن */}
                    <div className="p-2 md:p-3 border-t bg-white flex flex-col gap-2 shrink-0">
                        {/* ابزار پیام سریع */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button onClick={() => { setNote("لطفا کد تایید پیامک شده را ارسال کنید."); setSendToTelegram(true); }} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg whitespace-nowrap hover:bg-blue-100 border border-blue-100 transition">درخواست کد</button>
                            <button onClick={() => { setNote("اطلاعات اکانت اشتباه است. لطفا بررسی کنید."); setSendToTelegram(true); }} className="text-[10px] bg-orange-50 text-orange-600 px-2 py-1 rounded-lg whitespace-nowrap hover:bg-orange-100 border border-orange-100 transition">اطلاعات غلط</button>
                            <button onClick={() => { setNote("سفارش شما انجام شد. با تشکر."); setSendToTelegram(true); }} className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-lg whitespace-nowrap hover:bg-green-100 border border-green-100 transition">انجام شد</button>
                        </div>

                        <div className="flex gap-2 items-center">
                            <div 
                                onClick={() => setSendToTelegram(!sendToTelegram)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer transition border ${sendToTelegram ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${sendToTelegram ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                                    {sendToTelegram && <span className="text-white text-[10px]">✓</span>}
                                </div>
                                <span className={`text-xs font-bold ${sendToTelegram ? 'text-blue-600' : 'text-gray-500'}`}>تلگرام</span>
                            </div>

                            <input 
                                className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition text-black placeholder:text-gray-400" 
                                value={note} 
                                onChange={e=>setNote(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                                placeholder={sendToTelegram ? "پیام به تلگرام مشتری..." : "یادداشت داخلی..."} 
                            />
                            <button 
                                onClick={handleSaveNote} 
                                disabled={isSavingNote} 
                                className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap text-white transition ${sendToTelegram ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                            >
                                {sendToTelegram ? 'ارسال' : 'ثبت'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>

        {/* 🟢 فوتر: دکمه‌ها */}
        <div className="p-2 md:p-4 bg-white border-t flex flex-col md:flex-row justify-between items-center gap-2 md:gap-3 shrink-0 z-10">
             
             {/* دکمه انصراف */}
             <div className="w-full md:w-auto order-2 md:order-1 flex justify-center md:justify-start">
                 <button onClick={() => releaseOrder(order.id)} className="text-gray-400 text-xs px-2 py-1">
                    انصراف و بستن
                 </button>
             </div>

             {/* دکمه‌های اصلی */}
             <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center md:justify-end w-full order-1 md:order-2">
                <button onClick={() => handleStatusChange('wrong_info')} className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-2 rounded-lg text-[10px] md:text-xs font-bold grow md:grow-0">⚠️ اطلاعات غلط</button>
                <button onClick={() => handleStatusChange('verification')} className="bg-purple-50 text-purple-600 border border-purple-200 px-2 py-2 rounded-lg text-[10px] md:text-xs font-bold grow md:grow-0">🆔 احراز</button>
                <button onClick={() => handleStatusChange('refund-req')} className="bg-red-50 text-red-600 border border-red-200 px-2 py-2 rounded-lg text-[10px] md:text-xs font-bold grow md:grow-0">💸 درخواست استرداد</button>
                
                <button onClick={() => handleStatusChange('completed')} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold shadow-md grow md:grow-0 flex items-center justify-center gap-1">
                    ✅ تکمیل سفارش
                </button>
             </div>
        </div>
      </div>
    </div>
  );
}