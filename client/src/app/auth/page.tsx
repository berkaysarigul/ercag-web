'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI-10: Tüm inline style'lar Tailwind class'larına geçirildi

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        consent: false
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isLogin && !formData.consent) {
            setError('Lütfen üyelik sözleşmesini kabul ediniz.');
            return;
        }

        setLoading(true);
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const res = await api.post(endpoint, formData);

            login(res.data.token, res.data.user);
            router.back();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Bir hata oluştu.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
                    <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
                        {isLogin ? 'Giriş Yap' : 'Hızlı Üyelik'}
                    </h1>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                                    <input
                                        type="text"
                                        required
                                        className="input w-full"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                    <input
                                        type="tel"
                                        required
                                        className="input w-full"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                            <input
                                type="email"
                                required
                                className="input w-full"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                            <input
                                type="password"
                                required
                                className="input w-full"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            {isLogin && (
                                <div className="flex justify-end mt-1">
                                    <Link href="/auth/forgot-password" className="text-xs text-brand-600 hover:underline">
                                        Şifremi Unuttum?
                                    </Link>
                                </div>
                            )}
                        </div>

                        {!isLogin && (
                            <div className="flex items-start gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    id="consent"
                                    className="mt-1"
                                    checked={formData.consent}
                                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                                />
                                <label htmlFor="consent" className="text-gray-600">
                                    Kampanya ve bilgilendirmeler için iletişim bilgilerimin kullanılmasını ve üyelik sözleşmesini kabul ediyorum.
                                </label>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary w-full mt-2"
                            disabled={loading}
                        >
                            {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Üye Ol ve Devam Et')}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        {/* UI-01: var(--accent) → brand-600 */}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-brand-600 hover:underline bg-transparent border-none cursor-pointer"
                        >
                            {isLogin ? 'Hesabın yok mu? Hemen üye ol' : 'Zaten üye misin? Giriş yap'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
