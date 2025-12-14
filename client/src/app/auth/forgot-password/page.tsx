'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            toast.success('Sıfırlama kodu gönderildi.');
            // Pass email via query param to autofill the next page
            router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
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
                    <Link href="/auth" className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
                        <ArrowLeft size={16} className="mr-1" />
                        Giriş Ekranına Dön
                    </Link>
                    <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                        <Mail size={24} />
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        Şifrenizi mi unuttunuz?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        E-posta adresinizi girin, size şifrenizi sıfırlamanız için bir kod gönderelim.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">E-posta Adresi</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="E-posta adresi"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md hover:shadow-lg`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Gönderiliyor...
                                </span>
                            ) : (
                                'Sıfırlama Kodu Gönder'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
