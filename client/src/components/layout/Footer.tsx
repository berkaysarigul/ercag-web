'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail, Clock } from 'lucide-react';

import { useSettings } from "@/context/SettingsContext";

export default function Footer() {
    const { settings } = useSettings();
    const year = new Date().getFullYear();

    return (
        <footer className="bg-[var(--primary)] text-white pt-16 pb-8 mt-auto">
            <div className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="bg-white p-2 w-fit rounded-lg">
                            <Image
                                src="/logo.png"
                                alt={settings.site_title || "Erçağ Kırtasiye"}
                                width={120}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {settings.site_description || "Okul, ofis ve sanatsal tüm ihtiyaçlarınız için güvenilir adresiniz. Kaliteli ürünler, uygun fiyatlar ve güler yüzlü hizmet."}
                        </p>
                        {/* UI-01: var(--accent) artık tanımlı */}
                        <div className="flex gap-4">
                            {settings.social_instagram && (
                                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-amber-400 transition-colors">
                                    <Instagram size={18} />
                                </a>
                            )}
                            {settings.social_facebook && (
                                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-amber-400 transition-colors">
                                    <Facebook size={18} />
                                </a>
                            )}
                            {settings.social_twitter && (
                                <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-amber-400 transition-colors">
                                    <Twitter size={18} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-amber-400">Hızlı Erişim</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/" className="text-gray-300 hover:text-white transition-colors">Ana Sayfa</Link>
                            </li>
                            <li>
                                <Link href="/products" className="text-gray-300 hover:text-white transition-colors">Tüm Ürünler</Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Gizlilik Politikası</Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Kullanım Koşulları</Link>
                            </li>
                        </ul>
                    </div>

                    {/* UI-12: "Sayfalar" → "Hesabım" olarak değiştirildi */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-amber-400">Hesabım</h3>
                        <ul className="space-y-3">
                            <li><Link href="/auth" className="text-gray-300 hover:text-white transition-colors">Giriş Yap</Link></li>
                            <li><Link href="/profile" className="text-gray-300 hover:text-white transition-colors">Profilim</Link></li>
                            <li><Link href="/wishlist" className="text-gray-300 hover:text-white transition-colors">Favorilerim</Link></li>
                            <li><Link href="/cart" className="text-gray-300 hover:text-white transition-colors">Sepetim</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-amber-400">İletişim</h3>
                        {/* UI-11: Emoji ikonlar → Lucide React */}
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <MapPin size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-300 text-sm whitespace-pre-line">
                                    {settings.site_address || "Atatürk Caddesi No: 123\nMerkez, İstanbul"}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={16} className="text-amber-400 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">{settings.site_phone || "+90 (212) 123 45 67"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={16} className="text-amber-400 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">{settings.site_email || "info@ercagkirtasiye.com"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Clock size={16} className="text-amber-400 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">{settings.working_hours || "Pzt - Cmt: 09:00 - 19:00"}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; {year} {settings.site_title || "Erçağ Kırtasiye"}. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </footer>
    );
}
