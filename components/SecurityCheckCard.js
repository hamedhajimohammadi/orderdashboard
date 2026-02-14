
import { Shield, CreditCard, UserCheck, AlertTriangle, CheckCircle, FileText, ExternalLink } from 'lucide-react';

export default function SecurityCheckCard({ order }) {
    const user = order.user || {};
    const paymentCard = order.payment_card_number;
    const kycCard = user.card_number;

    // --- Logic: Compare Cards ---
    let cardMatchStatus = 'missing'; // missing, match, mismatch
    if (paymentCard && kycCard) {
        // Normalize: remove spaces, dashes
        const p = paymentCard.replace(/\D/g, '');
        const k = kycCard.replace(/\D/g, '');
        
        // Compare last 4 digits
        if (p.slice(-4) === k.slice(-4)) {
            cardMatchStatus = 'match';
        } else {
            cardMatchStatus = 'mismatch';
        }
    } else if (!paymentCard && !kycCard) {
        cardMatchStatus = 'missing';
    } else {
        // One is missing
        cardMatchStatus = 'incomplete';
    }

    const verificationImageUrl = user.verification_file 
        ? `https://pgemshop.com/wp-content/uploads/mnsfpt_uploads/${user.verification_file}`
        : null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-800">بررسی امنیتی و احراز هویت (KYC)</h3>
            </div>
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Column 1: Identity Profile */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-500 flex items-center gap-1 mb-2">
                        <UserCheck className="w-4 h-4" />
                        پروفایل هویتی کاربر
                    </h4>
                    
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">نام حقیقی:</span>
                            <span className="font-bold text-gray-800">{user.real_name || '---'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">کد ملی:</span>
                            <span className="font-mono text-gray-800">{user.national_code || '---'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">نام بانک:</span>
                            <span className="text-gray-800">{user.bank_name || '---'}</span>
                        </div>
                    </div>

                    {verificationImageUrl ? (
                        <a 
                            href={verificationImageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-bold border border-indigo-200"
                        >
                            <FileText className="w-4 h-4" />
                            مشاهده تصویر مدارک
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    ) : (
                        <div className="text-center py-2 text-gray-400 text-xs bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            تصویر مدارک یافت نشد
                        </div>
                    )}
                </div>

                {/* Column 2: Payment Match Check */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-500 flex items-center gap-1 mb-2">
                        <CreditCard className="w-4 h-4" />
                        تطابق کارت بانکی
                    </h4>

                    <div className={`p-4 rounded-lg border-2 ${
                        cardMatchStatus === 'match' ? 'bg-green-50 border-green-200' :
                        cardMatchStatus === 'mismatch' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-500">کارت احراز شده (KYC):</span>
                            <span className="font-mono font-bold text-gray-700 dir-ltr">
                                {user.card_number ? `...${user.card_number.slice(-4)}` : '---'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs text-gray-500">کارت پرداخت (درگاه):</span>
                            <span className="font-mono font-bold text-gray-700 dir-ltr">
                                {paymentCard ? `...${paymentCard.slice(-4)}` : '---'}
                            </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex justify-center">
                            {cardMatchStatus === 'match' && (
                                <div className="flex items-center gap-2 text-green-700 font-bold bg-white px-3 py-1 rounded-full shadow-sm border border-green-100">
                                    <CheckCircle className="w-5 h-5" />
                                    تطابق کارت تایید شد
                                </div>
                            )}
                            {cardMatchStatus === 'mismatch' && (
                                <div className="flex items-center gap-2 text-red-600 font-bold bg-white px-3 py-1 rounded-full shadow-sm border border-red-100 animate-pulse">
                                    <AlertTriangle className="w-5 h-5" />
                                    هشدار: عدم تطابق کارت بانکی
                                </div>
                            )}
                            {(cardMatchStatus === 'missing' || cardMatchStatus === 'incomplete') && (
                                <div className="flex items-center gap-2 text-gray-500 font-bold bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                                    <AlertTriangle className="w-5 h-5" />
                                    اطلاعات ناقص
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 leading-relaxed text-center">
                        * سیستم به صورت خودکار ۴ رقم آخر کارت پرداخت شده در درگاه را با کارت ثبت شده در پروفایل کاربر مقایسه می‌کند.
                    </p>
                </div>
            </div>
        </div>
    );
}
