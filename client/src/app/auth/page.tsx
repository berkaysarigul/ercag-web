'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

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
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isLogin && !formData.consent) {
            setError('Lütfen üyelik sözleşmesini kabul ediniz.');
            return;
        }

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const res = await api.post(endpoint, formData);

            login(res.data.token, res.data.user);

            // Redirect back to cart or home
            router.back();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Bir hata oluştu.');
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', padding: '4rem 0' }}>
            <div className="card">
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                    {isLogin ? 'Giriş Yap' : 'Hızlı Üyelik'}
                </h1>

                {error && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isLogin && (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Ad Soyad</label>
                                <input
                                    type="text"
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Telefon</label>
                                <input
                                    type="tel"
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>E-posta</label>
                        <input
                            type="email"
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Şifre</label>
                        <input
                            type="password"
                            required
                            style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    {!isLogin && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <input
                                type="checkbox"
                                id="consent"
                                checked={formData.consent}
                                onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                            />
                            <label htmlFor="consent" style={{ color: 'var(--text-secondary)' }}>
                                Kampanya ve bilgilendirmeler için iletişim bilgilerimin kullanılmasını ve üyelik sözleşmesini kabul ediyorum.
                            </label>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        {isLogin ? 'Giriş Yap' : 'Üye Ol ve Devam Et'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                        {isLogin ? 'Hesabın yok mu? Hemen üye ol' : 'Zaten üye misin? Giriş yap'}
                    </button>
                </div>
            </div>
        </div>
    );
}
