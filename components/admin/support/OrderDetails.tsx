'use client';
import { useEffect, useState } from 'react';
import { ExternalLink, User as UserIcon, Calendar, CreditCard } from 'lucide-react';

export default function OrderDetails({ orderId }: { orderId: number }) {
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(!orderId) return;
        setLoading(true);
        fetch(`/api/orders?id=${orderId}`)
            .then(res => res.json())
            .then(data => {
                if(data.success && data.data.length > 0) {
                    setOrder(data.data[0]);
                } else {
                    setOrder(null);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [orderId]);

    if(loading) return <div className="p-4 text-center text-gray-400 text-sm">در حال دریافت اطلاعات...</div>;
    if(!order) return <div className="p-4 text-center text-gray-400 text-sm">انتخاب کنید</div>;

    const formattedPrice = order.total_amount_gross 
         ? parseInt(order.total_amount_gross).toLocaleString('fa-IR') 
         : '0';

    return (
        <div className="space-y-6">
            <div className="border-b pb-4">
                <h3 className="font-black text-lg text-gray-800 flex items-center gap-2">
                    سفارش #{order.wp_order_id}
                </h3>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold
                    ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      order.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                </span>
            </div>
            
            <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500">
                        <CreditCard className="w-4 h-4" />
                        <span>مبلغ:</span>
                    </div>
                    <span className="font-bold text-gray-800">{formattedPrice} تومان</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>تاریخ:</span>
                    </div>
                    <span className="dir-ltr text-gray-800">
                        {new Date(order.order_date).toLocaleDateString('fa-IR')}
                    </span>
                </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-gray-800 font-bold mb-2">
                    <UserIcon className="w-4 h-4" />
                    <span>اطلاعات مشتری</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                    <p>نام: {order.user?.display_name ||  order.user?.first_name || 'نامشخص'}</p>
                    <p className="dir-ltr text-right">موبایل: {order.user?.phone_number}</p>
                    {order.user?.telegram_username && (
                        <p className="text-blue-500 dir-ltr text-right">@{order.user.telegram_username}</p>
                    )}
                </div>
            </div>
            
            <a 
               href={`/order-dashboard?highlight=${order.id}`} 
               target="_blank"
               className="flex items-center justify-center gap-2 w-full bg-white border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all font-bold text-sm"
            >
                <ExternalLink className="w-4 h-4" />
                مشاهده و مدیریت سفارش
            </a>
        </div>
    );
}
