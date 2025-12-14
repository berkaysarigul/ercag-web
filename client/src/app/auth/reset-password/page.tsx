'use client';

import { useState, useEffect, Suspense } from 'react';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, Lock, ArrowRight } from 'lucide-react';

function ResetPasswordForm() {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Şifreler eşleşmiyor!');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', { email, code, newPassword });
            toast.success('Şifreniz başarıyla güncellendi! Giriş yapılıyor...');

            setTimeout(() => {
                router.push('/auth');
            }, 2000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div>
                    <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                        <KeyRound size={24} />
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        Şifre Sıfırlama
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Email adresinize gelen doğrulama kodunu ve yeni şifrenizi giriniz.
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                            <input
                                type="email"
                                required
                                readOnly={!!searchParams.get('email')}
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 text-gray-500 bg-gray-50 rounded-lg focus:outline-none sm:text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Doğrulama Kodu</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm tracking-widest font-mono text-center text-lg"
                                placeholder="XXXXXX"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Yeni Şifre</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <Lock size={16} />
                                </span>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Yeni Şifre"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre Tekrar</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                                    <Lock size={16} />
                                </span>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Şifreyi Onayla"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-md hover:shadow-lg`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Güncelleniyor...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    Şifreyi Güncelle
                                    <ArrowRight size={16} className="ml-2" />
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Yükleniyor...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
