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
                        <div key={campaign.id} className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/20 p-3 rounded-full animate-pulse shrink-0">
                                    <Zap size={24} className="text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl">{campaign.name}</h3>
                                    <p className="text-white/90 text-sm">Seçili ürünlerde %{config.discountPercent} indirim!</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg font-mono font-bold text-lg">
                                    <Clock size={18} />
                                    <span>{timeLeft[campaign.id] || '...'}</span>
                                </div>
                                <Link href="/products?flash_sale=true"
                                    className="bg-white text-red-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-md whitespace-nowrap">
                                    İncele →
                                </Link>
                            </div>
                        </div>
                    );
                }

                if (campaign.type === 'CATEGORY_DISCOUNT') {
                    return (
                        <div key={campaign.id} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-xl shadow-md flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2.5 rounded-full shrink-0">
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{campaign.name}</h3>
                                    <p className="text-sm text-white/90">Kategoride %{config.discountPercent} indirim fırsatı</p>
                                </div>
                            </div>
                            <Link href={`/products?categoryId=${config.categoryId}`}
                                className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0">
                                Alışverişe Başla
                            </Link>
                        </div>
                    );
                }

                if (campaign.type === 'BUY_X_GET_Y') {
                    return (
                        <div key={campaign.id} className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 rounded-xl shadow-md flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2.5 rounded-full shrink-0">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{campaign.name}</h3>
                                    <p className="text-sm text-white/90">{config.buyQuantity} al, {config.payQuantity} öde kampanyası!</p>
                                </div>
                            </div>
                            <Link href="/products"
                                className="bg-white/20 hover:bg-white/30 px-5 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0">
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
