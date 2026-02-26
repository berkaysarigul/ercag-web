'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail, Clock, ArrowUpRight } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

export default function Footer() {
    const { settings } = useSettings();
    const year = new Date().getFullYear();

    const quickLinks = [
        { href: '/', label: 'Ana Sayfa' },
        { href: '/products', label: 'Tüm Ürünler' },
        { href: '/order-track', label: 'Sipariş Takibi' },
        { href: '/privacy', label: 'Gizlilik Politikası' },
        { href: '/terms', label: 'Kullanım Koşulları' },
        { href: '/distance-sales', label: 'Mesafeli Satış Sözleşmesi' },
    ];

    const accountLinks = [
        { href: '/auth', label: 'Giriş Yap' },
        { href: '/profile', label: 'Profilim' },
        { href: '/wishlist', label: 'Favorilerim' },
        { href: '/cart', label: 'Sepetim' },
    ];

    const socials = [
        { href: settings.social_instagram ? String(settings.social_instagram) : '', icon: Instagram, label: 'Instagram' },
        { href: settings.social_facebook ? String(settings.social_facebook) : '', icon: Facebook, label: 'Facebook' },
        { href: settings.social_twitter ? String(settings.social_twitter) : '', icon: Twitter, label: 'Twitter' },
    ].filter(s => s.href);

    return (
        <footer className="bg-[#f4f4f0] text-gray-800 mt-auto pt-16 pb-8 border-t border-[#e2e8f0]">
            {/* Main footer */}
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">

                    {/* Brand */}
                    <div className="md:col-span-4 space-y-5">
                        <div className="flex flex-col">
                            <span className="font-serif font-medium text-gray-900 text-3xl tracking-tight leading-none">Erçağ</span>
                            <span className="text-xs text-primary italic font-serif mt-1">KIRTASİYE</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                            {settings.site_description || "İstanbul'un güvenilir kırtasiye mağazası."}
                        </p>
                        {socials.length > 0 && (
                            <div className="flex gap-3 pt-2">
                                {socials.map(({ href, icon: Icon, label }) => (
                                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                                        className="w-10 h-10 bg-white shadow-sm hover:bg-primary text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-300"
                                        aria-label={label}>
                                        <Icon size={18} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-serif italic text-gray-900 mb-4">Hızlı Erişim</h3>
                        <ul className="space-y-3">
                            {quickLinks.map(({ href, label }) => (
                                <li key={href}>
                                    <Link href={href} className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5 group">
                                        <ArrowUpRight size={14} className="text-primary/50 group-hover:text-primary transition-colors" />
                                        <span>{label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account */}
                    <div className="md:col-span-2">
                        <h3 className="text-sm font-serif italic text-gray-900 mb-4">Hesabım</h3>
                        <ul className="space-y-3">
                            {accountLinks.map(({ href, label }) => (
                                <li key={href}>
                                    <Link href={href} className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5 group">
                                        <ArrowUpRight size={14} className="text-primary/50 group-hover:text-primary transition-colors" />
                                        <span>{label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="md:col-span-4">
                        <h3 className="text-sm font-serif italic text-gray-900 mb-4">İletişim</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
                                <span className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">
                                    {settings.site_address || 'Atatürk Caddesi No: 123\nMerkez, İstanbul'}
                                </span>
                            </li>
                            <li className="flex items-center gap-4">
                                <Phone size={18} className="text-primary shrink-0" />
                                <span className="text-gray-600 text-sm">{settings.site_phone || '+90 (212) 123 45 67'}</span>
                            </li>
                            {settings.site_email && (
                                <li className="flex items-center gap-4">
                                    <Mail size={18} className="text-primary shrink-0" />
                                    <span className="text-gray-600 text-sm">{settings.site_email}</span>
                                </li>
                            )}
                            <li className="flex items-center gap-4">
                                <Clock size={18} className="text-primary shrink-0" />
                                <span className="text-gray-600 text-sm">{settings.working_hours || 'Pzt – Cmt: 09:00 – 19:30'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-[#d1d1c4] mt-8">
                <div className="container py-6 text-center">
                    <p className="text-xs text-gray-500">© {year} {settings.site_title || 'Erçağ Kırtasiye'}. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </footer>
    );
}
