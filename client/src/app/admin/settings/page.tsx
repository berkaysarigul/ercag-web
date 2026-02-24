'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Save, Loader2, Globe, Phone, MapPin, Instagram, Facebook } from 'lucide-react';
import Image from 'next/image';

export default function AdminSettings() {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            // Convert array to object for easier form handling if API returns array
            // If API returns array:
            const settingsMap = res.data.reduce((acc: any, curr: any) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});
            setSettings(settingsMap);
        } catch (error) {
            console.error('Failed to fetch settings', error);
            toast.error('Ayarlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/settings', settings);
            toast.success('Ayarlar kaydedildi');
        } catch (error) {
            console.error('Failed to save settings', error);
            toast.error('Ayarlar kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('logo', file);

        const toastId = toast.loading('Logo yükleniyor...');

        try {
            const res = await api.post('/settings/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSettings((prev: any) => ({ ...prev, site_logo: res.data.logoUrl }));
            toast.success('Logo güncellendi', { id: toastId });
            // Force refresh explicitly or rely on state update
            window.location.reload();
        } catch (error) {
            console.error('Logo upload error:', error);
            toast.error('Logo yüklenemedi', { id: toastId });
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Site Ayarları</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">

                {/* General Settings */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Globe size={20} /> Genel Bilgiler
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Başlığı</label>
                            <input
                                type="text"
                                name="site_title"
                                value={settings.site_title || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="Örn: Erçağ Kırtasiye"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site Açıklaması</label>
                            <input
                                type="text"
                                name="site_description"
                                value={settings.site_description || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="SEO için site açıklaması"
                            />
                        </div>
                    </div>
                </div>

                <hr />

                {/* Logo Settings */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Loader2 className={loading ? "animate-spin" : "hidden"} /> Logo Ayarları
                    </h2>
                    <div className="flex items-start gap-6">
                        <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                            {settings.site_logo ? (
                                <div className="relative w-full h-full p-2">
                                    <Image
                                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${settings.site_logo}`}
                                        alt="Site Logo"
                                        fill
                                        sizes="160px"
                                        className="object-contain p-2"
                                    />
                                </div>
                            ) : (
                                <span className="text-gray-400 text-sm">Logo Yok</span>
                            )}
                            <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-medium">
                                Değiştir
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-900">Site Logosu</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                PNG, JPG veya SVG formatında yükleyin. Önerilen boyut: 200x60px.
                            </p>
                            <div className="mt-4">
                                <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    Yeni Logo Yükle
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <hr />

                {/* Contact Settings */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Phone size={20} /> İletişim Bilgileri
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası</label>
                            <input
                                type="text"
                                name="site_phone"
                                value={settings.site_phone || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta Adresi</label>
                            <input
                                type="email"
                                name="site_email"
                                value={settings.site_email || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14} /> Adres</label>
                            <textarea
                                name="site_address"
                                value={settings.site_address || ''}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <hr />

                {/* Social Media */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        <Instagram size={20} /> Sosyal Medya
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <Instagram size={20} className="text-pink-600" />
                            <input
                                type="text"
                                name="social_instagram"
                                value={settings.social_instagram || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="Instagram Link"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Facebook size={20} className="text-blue-600" />
                            <input
                                type="text"
                                name="social_facebook"
                                value={settings.social_facebook || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="Facebook Link"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Kaydet
                    </button>
                </div>
            </form >
        </div >
    );
}
