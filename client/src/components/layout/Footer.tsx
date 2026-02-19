'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

import { useSettings } from "@/context/SettingsContext";

export default function Footer() {
    const { settings } = useSettings();

    // Get current year
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
                        <div className="flex gap-4">
                            {/* Social Media Icons (Dynamic) */}
                            {settings.social_instagram && (
                                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--accent)] transition-colors">
                                    📷
                                </a>
                            )}
                            {settings.social_facebook && (
                                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--accent)] transition-colors">
                                    📘
                                </a>
                            )}
                            <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[var(--accent)] transition-colors">
                                🐦
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-[var(--accent)]">Hızlı Erişim</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/" className="text-gray-300 hover:text-white transition-colors">Ana Sayfa</Link>
                            </li>
                            <li>
                                <Link href="/products" className="text-gray-300 hover:text-white transition-colors">Tüm Ürünler</Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">Hakkımızda</Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">İletişim</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-[var(--accent)]">Kategoriler</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/products?category=Defterler" className="text-gray-300 hover:text-white transition-colors">Defterler</Link>
                            </li>
                            <li>
                                <Link href="/products?category=Kalemler" className="text-gray-300 hover:text-white transition-colors">Kalemler</Link>
                            </li>
                            <li>
                                <Link href="/products?category=Ofis" className="text-gray-300 hover:text-white transition-colors">Ofis Malzemeleri</Link>
                            </li>
                            <li>
                                <Link href="/products?category=Sanat" className="text-gray-300 hover:text-white transition-colors">Sanat Malzemeleri</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-[var(--accent)]">İletişim</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="text-[var(--accent)] mt-1">📍</span>
                                <span className="text-gray-300 text-sm whitespace-pre-line">
                                    {settings.site_address || "Atatürk Caddesi No: 123\nMerkez, İstanbul"}
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-[var(--accent)]">📞</span>
                                <span className="text-gray-300 text-sm">{settings.site_phone || "+90 (212) 123 45 67"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-[var(--accent)]">✉️</span>
                                <span className="text-gray-300 text-sm">{settings.site_email || "info@ercagkirtasiye.com"}</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-[var(--accent)]">⏰</span>
                                <span className="text-gray-300 text-sm">Pzt - Cmt: 09:00 - 20:00</span>
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
