'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Settings, Power, Bell, Clock, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        storeOpen: 'true',
        defaultPrepTime: '15',
        orderNotifications: 'true',
        promoNotifications: 'false'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            // Merge defaults with fetched
            if (res.data) {
                setSettings(prev => ({ ...prev, ...res.data }));
            }
        } catch (error) {
            console.error('Settings fetch error', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/settings', settings);
            toast.success('Ayarlar kaydedildi');
        } catch (error) {
            toast.error('Kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>;

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Mağaza Ayarları</h1>
                    <p className="text-gray-500">Sistem yapılandırması.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary px-6 py-2 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Kaydet
                </button>
            </div>

            <div className="grid gap-6">
                {/* Store Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Power className={settings.storeOpen === 'true' ? 'text-green-500' : 'text-red-500'} />
                        Mağaza Durumu
                    </h2>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleChange('storeOpen', 'true')}
                            className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${settings.storeOpen === 'true'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 text-gray-400 hover:border-green-200'
                                }`}
                        >
                            AÇIK
                        </button>
                        <button
                            onClick={() => handleChange('storeOpen', 'false')}
                            className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all ${settings.storeOpen === 'false'
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 text-gray-400 hover:border-red-200'
                                }`}
                        >
                            KAPALI
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        Mağaza kapalıyken müşteriler sipariş oluşturamaz (Sadece görüntüleyebilir).
                    </p>
                </div>

                {/* Preparation Time */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Clock className="text-primary" />
                        Varsayılan Hazırlık Süresi
                    </h2>
                    <div className="flex items-center gap-4">
                        <input
                            type="number"
                            className="input w-32 font-bold text-lg"
                            value={settings.defaultPrepTime}
                            onChange={(e) => handleChange('defaultPrepTime', e.target.value)}
                        />
                        <span className="text-gray-700 font-medium">Dakika</span>
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Bell className="text-yellow-500" />
                        Bildirimler (Sanal)
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700 font-medium">Yeni Sipariş Bildirimi</span>
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    name="toggle"
                                    id="notifications"
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                    checked={settings.orderNotifications === 'true'}
                                    onChange={(e) => handleChange('orderNotifications', e.target.checked ? 'true' : 'false')}
                                />
                                <label
                                    htmlFor="notifications"
                                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.orderNotifications === 'true' ? 'bg-green-400' : 'bg-gray-300'}`}
                                ></label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .toggle-checkbox:checked {
                    right: 0;
                    border-color: #68D391;
                }
                .toggle-checkbox {
                    right: auto;
                    left: 0;
                    border-color: #CBD5E0;
                    transition: all 0.3s;
                }
                .toggle-label {
                    transition: background-color 0.3s;
                }
            `}</style>
        </div>
    );
}
