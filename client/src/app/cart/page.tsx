'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import { CartSkeleton } from '@/components/cart/CartSkeleton';
import { toast } from 'sonner';
import Image from 'next/image';
import { Trash2, Plus, Minus, ArrowRight, Store, ShoppingBag, User, Phone, Mail, Clock, FileText, MapPin } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, decreaseQuantity, total, discountAmount, finalAmount, appliedCampaigns, clearCart, loaded, refreshCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
    const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Branch State
    const [branches, setBranches] = useState<{ id: number; name: string; address: string; district: string | null; phone: string | null }[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<number | null>(null);

    // Checkout State
    const [step, setStep] = useState<'cart' | 'info'>('cart');
    const [formData, setFormData] = useState({
        fullName: '',
        phoneNumber: '',
        email: '',
        note: '',
        pickupRequestedTime: 'Bugün'
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.name || '',
                email: user.email || '',
                phoneNumber: user.phone || ''
            }));
        }
    }, [user]);

    useEffect(() => {
        if (user) refreshCart();
    }, [user]);

    useEffect(() => {
        api.get('/branches?active=true').then(res => {
            setBranches(res.data);
            if (res.data.length === 1) setSelectedBranch(res.data[0].id); // Tek şube varsa otomatik seç
        });
    }, []);

    const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const campaignDiscount = discountAmount;
    const finalTotal = finalAmount > 0
        ? Math.max(0, finalAmount - couponDiscount)
        : Math.max(0, total - couponDiscount);

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setLoading(true);
        setCouponMessage(null);
        try {
            const res = await api.post('/coupons/validate', { code: couponCode, cartTotal: total });
            setAppliedCoupon({ code: res.data.couponCode, discountAmount: res.data.discountAmount });
            setCouponMessage({ type: 'success', text: `Kupon uygulandı: ${res.data.discountAmount} ₺ indirim` });
            toast.success('Kupon uygulandı');
        } catch (error: unknown) {
            const errResponse = (error as any)?.response;
            setAppliedCoupon(null);
            setCouponMessage({ type: 'error', text: errResponse?.data?.message || 'Geçersiz kupon' });
            toast.error('Geçersiz kupon');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!user) {
            setShowAuthModal(true);
            return;
        }

        if (!formData.fullName || !formData.phoneNumber) {
            // Fallback if somehow empty
            toast.error('Lütfen bilgilerinizi kontrol edin.');
            return;
        }

        if (!selectedBranch) {
            toast.error('Lütfen teslim alacağınız şubeyi seçin.');
            return;
        }

        setLoading(true);
        try {
            const orderData = {
                items: items.map(item => ({
                    id: item.id,
                    quantity: item.quantity
                })),
                variantItems: items.filter(item => item.variantId).map(item => ({
                    variantId: item.variantId,
                    quantity: item.quantity
                })),
                couponCode: appliedCoupon?.code,
                branchId: selectedBranch,
                ...formData
            };
            const res = await api.post('/orders', orderData);
            clearCart();
            toast.success('Siparişiniz başarıyla oluşturuldu!');
            // Redirect to success page with pickup code
            router.push(`/order-success?id=${res.data.id}&code=${res.data.pickupCode}&amount=${res.data.totalAmount}`);
        } catch (error: unknown) {
            console.error('Order failed', error);
            const errResponse = (error as any)?.response;
            const msg = errResponse?.data?.error || 'Sipariş oluşturulurken bir hata oluştu.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!loaded) {
        return <div className="container py-12"><CartSkeleton /></div>;
    }

    if (items.length === 0) {
        return (
            <div className="container py-20 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                    <ShoppingBag size={48} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Sepetiniz Boş</h1>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">Henüz sepetinize ürün eklemediniz. İhtiyacınız olan kırtasiye ürünlerini hemen keşfedin.</p>
                <Link href="/products" className="btn btn-primary px-8 py-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                    Alışverişe Başla
                </Link>
            </div>
        );
    }

    return (
        <div className="container pt-36 pb-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif text-gray-900 tracking-tight flex items-center">
                    <ShoppingBag className="mr-3 text-primary" />
                    {step === 'cart' ? `Sepetim (${items.length} Ürün)` : 'Siparişi Tamamla'}
                </h1>
                {step === 'cart' && items.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('Sepetinizdeki tüm ürünleri silmek istediğinize emin misiniz?')) {
                                clearCart();
                            }
                        }}
                        className="text-red-500 hover:text-red-700 font-medium flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                        Sepeti Temizle
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Cart Items or Form */}
                <div className="lg:col-span-2 space-y-4">
                    {step === 'cart' ? (
                        <>
                            {items.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 items-center hover:shadow-md transition-shadow">
                                    <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                                        {item.image ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={item.image.startsWith('http') ? item.image : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${item.image}`}
                                                    alt={item.name}
                                                    fill
                                                    unoptimized
                                                    sizes="96px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">📷</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Link href={`/products/${item.id}`} className="font-semibold text-lg text-gray-900 hover:text-primary transition-colors">
                                            {item.name}
                                        </Link>
                                        {(item as any).variantLabel && (
                                            <span className="text-xs text-gray-500 block mt-0.5">{(item as any).variantLabel}</span>
                                        )}
                                        <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-1">{(item as any).category?.name}</p>
                                        <div className="mt-2 text-lg font-bold text-primary">{Number(item.price).toFixed(2)} ₺</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                                            <button onClick={() => decreaseQuantity(item.id, (item as any).variantId)} className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"><Minus size={16} /></button>
                                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1, (item as any).variantId)} className="p-2 hover:bg-gray-200 text-gray-600 transition-colors"><Plus size={16} /></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id, (item as any).variantId)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Sepetten Kaldır"><Trash2 size={20} /></button>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="space-y-4">
                            {/* Şube Seçimi */}
                            {branches.length > 1 && (
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                        <MapPin size={18} className="text-primary" /> Teslim Alınacak Şube
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">Siparişinizi hangi şubemizden teslim almak istersiniz?</p>
                                    <div className="grid gap-3">
                                        {branches.map(b => (
                                            <button key={b.id} type="button" onClick={() => setSelectedBranch(b.id)}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedBranch === b.id
                                                    ? 'border-primary bg-primary/5 shadow-sm'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedBranch === b.id ? 'border-primary' : 'border-gray-300'
                                                        }`}>
                                                        {selectedBranch === b.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{b.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{b.address}</p>
                                                        {b.phone && <p className="text-xs text-gray-400 mt-0.5">{b.phone}</p>}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Kişisel Bilgiler */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User className="text-primary" /> Kişisel Bilgiler</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user ? (
                                        <>
                                            <div>
                                                <label className="label">Ad Soyad (Zorunlu)</label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                                    <input
                                                        type="text"
                                                        className="input pl-10 w-full"
                                                        placeholder="Adınız ve Soyadınız"
                                                        value={formData.fullName}
                                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label">Telefon (Zorunlu)</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                                    <input
                                                        type="tel"
                                                        className="input pl-10 w-full"
                                                        placeholder="05xxxxxxxxx"
                                                        value={formData.phoneNumber}
                                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label">E-posta (Opsiyonel)</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                                    <input
                                                        type="email"
                                                        className="input pl-10 w-full"
                                                        placeholder="ornek@email.com"
                                                        value={formData.email}
                                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="md:col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-8 flex flex-col items-center text-center">
                                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                                                <User size={26} />
                                            </div>
                                            <h3 className="text-xl font-serif text-gray-900 mb-2">Giriş Yapın veya Hızlı Üye Olun</h3>
                                            <p className="text-sm text-gray-600 max-w-sm mb-0 leading-relaxed">
                                                Siparişinizi tamamlamak için sağ taraftaki butona tıklayarak hızlıca giriş yapabilir veya üyelik oluşturabilirsiniz.
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <label className="label">Teslim Alma Zamanı</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <select
                                                className="input pl-10 w-full"
                                                value={formData.pickupRequestedTime}
                                                onChange={e => setFormData({ ...formData, pickupRequestedTime: e.target.value })}
                                            >
                                                <option value="Bugün">Bugün (Mağazada Ödeme)</option>
                                                <option value="Yarın">Yarın</option>
                                                <option value="Daha Sonra">Daha Sonra</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="label">Sipariş Notu</label>
                                        <div className="relative">
                                            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                                            <textarea
                                                className="input pl-10 w-full min-h-[80px]"
                                                placeholder="Varsa notunuz..."
                                                value={formData.note}
                                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                                            ></textarea>
                                        </div>
                                    </div>
                                    {/* Sözleşme Onayı */}
                                    <div className="md:col-span-2 mt-4">
                                        <label className="flex items-start gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={acceptedTerms}
                                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                                className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary shrink-0"
                                            />
                                            <span className="text-sm text-gray-600 leading-relaxed">
                                                <Link href="/distance-sales" target="_blank" className="text-primary font-medium hover:underline">
                                                    Mesafeli Satış Sözleşmesi
                                                </Link>'ni ve{' '}
                                                <Link href="/terms" target="_blank" className="text-primary font-medium hover:underline">
                                                    Kullanım Koşulları
                                                </Link>'nı okudum, kabul ediyorum.
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Sipariş Özeti</h2>

                        {step === 'cart' && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">İndirim Kuponu</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Kupon Kodu"
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all uppercase font-medium bg-gray-50 text-sm"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                    />
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={loading || !couponCode}
                                        className="btn btn-outline px-4 py-2 text-sm"
                                    >
                                        Uygula
                                    </button>
                                </div>
                                {couponMessage && (
                                    <p className={`text-xs mt-2 font-medium ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                        {couponMessage.text}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600">
                                <span>Ara Toplam</span>
                                <span>{total.toFixed(2)} ₺</span>
                            </div>
                            {campaignDiscount > 0 && appliedCampaigns.map((c, i) => (
                                <div key={i} className="flex justify-between text-orange-600 font-medium text-sm">
                                    <span>🎯 {c.name}</span>
                                    <span>-{c.discount.toFixed(2)} ₺</span>
                                </div>
                            ))}
                            {appliedCoupon && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>🏷️ Kupon ({appliedCoupon.code})</span>
                                    <span>-{appliedCoupon.discountAmount.toFixed(2)} ₺</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-100">
                                <span>Toplam</span>
                                <span className="text-primary">{finalTotal.toFixed(2)} ₺</span>
                            </div>
                        </div>

                        {step === 'cart' ? (
                            <button
                                className="w-full py-4 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2 tracking-wide"
                                onClick={() => setStep('info')}
                            >
                                Devam Et <ArrowRight size={20} />
                            </button>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <button
                                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                    onClick={handleCheckout}
                                    disabled={loading || !acceptedTerms}
                                >
                                    {loading ? 'İşleniyor...' : (user ? 'Siparişi Tamamla' : 'Giriş Yap / Üye Ol ve Tamamla')}
                                    {!loading && <ArrowRight size={20} />}
                                </button>
                                <button
                                    className="text-gray-500 text-sm hover:underline"
                                    onClick={() => setStep('cart')}
                                >
                                    Sepete Dön
                                </button>
                            </div>
                        )}

                        <div className="mt-6 bg-[#f2f7f5] border border-primary/10 rounded-2xl p-6 text-sm text-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="bg-white p-2.5 rounded-full shadow-sm">
                                    <Store size={20} className="text-primary" />
                                </div>
                                <h3 className="font-serif italic text-lg text-primary">Tıkla & Gel Al</h3>
                            </div>
                            <p className="text-gray-600 leading-relaxed">
                                Siparişinizi mağazamızdan teslim alabilirsiniz.
                                Ödemenizi teslimat sırasında <strong className="font-semibold text-gray-900">Nakit</strong> veya <strong className="font-semibold text-gray-900">Kredi Kartı</strong> ile güvenle yapabilirsiniz.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    // Auth success, user will be set by context
                    // We can proceed to checkout automatically or let user click again?
                    // User state updates in useEffect, so formData will fill.
                    // Ideally we might want to auto-trigger checkout? 
                    // Let's just toast and let them click "Complete" since they might want to review details.
                }}
            />
        </div >
    );
}
