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
        { href: '/privacy', label: 'Gizlilik Politikası' },
        { href: '/terms', label: 'Kullanım Koşulları' },
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
        <footer className="bg-[var(--primary)] text-white mt-auto">
            {/* Main footer */}
            <div className="container py-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                    {/* Brand — 4 cols */}
                    <div className="md:col-span-4 space-y-4">
                        <div className="bg-white p-2 w-fit rounded-lg">
                            <Image
                                src="/logo.png"
                                alt={settings.site_title || 'Erçağ Kırtasiye'}
                                width={110}
                                height={36}
                                className="object-contain"
                            />
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                            {settings.site_description || 'Okul, ofis ve sanatsal tüm ihtiyaçlarınız için güvenilir adresiniz.'}
                        </p>
                        {socials.length > 0 && (
                            <div className="flex gap-3 pt-1">
                                {socials.map(({ href, icon: Icon, label }) => (
                                    <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                                        className="w-9 h-9 bg-white/10 hover:bg-amber-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                                        aria-label={label}>
                                        <Icon size={16} />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Links — 2 cols */}
                    <div className="md:col-span-2">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4">Hızlı Erişim</h3>
                        <ul className="space-y-2.5">
                            {quickLinks.map(({ href, label }) => (
                                <li key={href}>
                                    <Link href={href} className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1 group">
                                        <span>{label}</span>
                                        <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account — 2 cols */}
                    <div className="md:col-span-2">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4">Hesabım</h3>
                        <ul className="space-y-2.5">
                            {accountLinks.map(({ href, label }) => (
                                <li key={href}>
                                    <Link href={href} className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-1 group">
                                        <span>{label}</span>
                                        <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact — 4 cols */}
                    <div className="md:col-span-4">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4">İletişim</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2.5">
                                <MapPin size={14} className="text-amber-400 mt-0.5 shrink-0" />
                                <span className="text-white/60 text-sm whitespace-pre-line">
                                    {settings.site_address || 'Atatürk Caddesi No: 123\nMerkez, İstanbul'}
                                </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Phone size={14} className="text-amber-400 shrink-0" />
                                <span className="text-white/60 text-sm">{settings.site_phone || '+90 (212) 123 45 67'}</span>
                            </li>
                            {settings.site_email && (
                                <li className="flex items-center gap-2.5">
                                    <Mail size={14} className="text-amber-400 shrink-0" />
                                    <span className="text-white/60 text-sm">{settings.site_email}</span>
                                </li>
                            )}
                            <li className="flex items-center gap-2.5">
                                <Clock size={14} className="text-amber-400 shrink-0" />
                                <span className="text-white/60 text-sm">{settings.working_hours || 'Pzt – Cmt: 09:00 – 19:00'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10">
                <div className="container py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/40">
                    <p>© {year} {settings.site_title || 'Erçağ Kırtasiye'}. Tüm hakları saklıdır.</p>
                    <p>Click & Collect ile hızlı alışveriş</p>
                </div>
            </div>
        </footer>
    );
}
