'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Zap, Clock, ShoppingBag, Tag } from 'lucide-react';
import Link from 'next/link';

export default function CampaignBanner() {
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        // Use public endpoint — no auth required
        api.get('/campaigns/public')
            .then(res => setActiveCampaigns(res.data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (activeCampaigns.length === 0) return;

        const tick = () => {
            const newTimeLeft: { [key: number]: string } = {};
            activeCampaigns.forEach(c => {
                if (c.type === 'FLASH_SALE') {
                    const diff = Math.floor((new Date(c.endDate).getTime() - Date.now()) / 1000);
                    if (diff > 0) {
                        const h = Math.floor(diff / 3600);
                        const m = Math.floor((diff % 3600) / 60);
                        const s = diff % 60;
                        newTimeLeft[c.id] = `${h}s ${m}d ${s}sn`;
                    } else {
                        newTimeLeft[c.id] = 'Sona Erdi';
                    }
                }
            });
            setTimeLeft(newTimeLeft);
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [activeCampaigns]);

    if (activeCampaigns.length === 0) return null;

    return (
        <div className="container py-4 space-y-3">
            {activeCampaigns.map((campaign) => {
                let config: { categoryId?: number | string; discountPercent?: number; productIds?: number[] | string; buyQuantity?: number; payQuantity?: number; target?: string } = {};
                try { config = typeof campaign.config === 'string' ? JSON.parse(campaign.config) : campaign.config; } catch { }

                if (campaign.type === 'FLASH_SALE') {
                    return (
                        <div key={campaign.id} className="bg-gradient-to-r from-rose-600 to-red-500 text-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3.5 rounded-xl animate-pulse shrink-0">
                                    <Zap size={24} className="text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl mb-0.5">{campaign.name}</h3>
                                    <p className="text-white/90 text-sm">Seçili ürünlerde %{config.discountPercent} indirim!</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                                <div className="flex items-center justify-center gap-2 bg-black/20 w-full sm:w-auto px-5 py-2.5 rounded-xl font-mono font-bold text-lg border border-white/10">
                                    <Clock size={18} />
                                    <span>{timeLeft[campaign.id] || '...'}</span>
                                </div>
                                <Link href={`/products?category=${config.categoryId}`}
                                    className="bg-white text-rose-600 w-full sm:w-auto text-center px-6 py-2.5 rounded-xl font-bold hover:bg-rose-50 transition-colors shadow-sm whitespace-nowrap">
                                    Fırsatı Yakala
                                </Link>
                            </div>
                        </div>
                    );
                }

                if (campaign.type === 'CATEGORY_DISCOUNT') {
                    return (
                        <div key={campaign.id} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-xl shrink-0">
                                    <Tag size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-0.5">{campaign.name}</h3>
                                    <p className="text-sm text-blue-100">Kategoride %{config.discountPercent} indirim fırsatı</p>
                                </div>
                            </div>
                            <Link href={`/products?category=${config.categoryId}`}
                                className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap text-center w-full md:w-auto">
                                Alışverişe Başla
                            </Link>
                        </div>
                    );
                }

                if (campaign.type === 'BUY_X_GET_Y') {
                    return (
                        <div key={campaign.id} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-xl shrink-0">
                                    <ShoppingBag size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-0.5">{campaign.name}</h3>
                                    <p className="text-sm text-fuchsia-100">{config.buyQuantity} al, {config.payQuantity} öde kampanyası!</p>
                                </div>
                            </div>
                            <Link href="/products"
                                className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap text-center w-full md:w-auto">
                                Keşfet
                            </Link>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}
