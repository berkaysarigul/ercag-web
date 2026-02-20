'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Zap, Clock, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { differenceInSeconds } from 'date-fns';

export default function CampaignBanner() {
    const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState<{ [key: number]: string }>({});

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const res = await api.get('/campaigns?status=active');
                setActiveCampaigns(res.data);
            } catch (error) {
                console.error('Failed to fetch campaigns', error);
            }
        };

        fetchCampaigns();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft: { [key: number]: string } = {};

            activeCampaigns.forEach(campaign => {
                if (campaign.type === 'FLASH_SALE') {
                    const diff = differenceInSeconds(new Date(campaign.endDate), new Date());
                    if (diff > 0) {
                        const h = Math.floor(diff / 3600);
                        const m = Math.floor((diff % 3600) / 60);
                        const s = diff % 60;
                        newTimeLeft[campaign.id] = `${h}s ${m}d ${s}sn`;
                    } else {
                        newTimeLeft[campaign.id] = 'Sona Erdi';
                    }
                }
            });
            setTimeLeft(newTimeLeft);
        }, 1000);

        return () => clearInterval(timer);
    }, [activeCampaigns]);

    if (activeCampaigns.length === 0) return null;

    return (
        <div className="space-y-4 mb-8">
            {activeCampaigns.map((campaign) => {
                const config = typeof campaign.config === 'string' ? JSON.parse(campaign.config) : campaign.config;

                if (campaign.type === 'FLASH_SALE') {
                    return (
                        <div key={campaign.id} className="bg-gradient-to-r from-red-600 to-orange-500 text-white p-4 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between">
                            <div className="flex items-center gap-4 mb-3 md:mb-0">
                                <div className="bg-white/20 p-3 rounded-full animate-pulse">
                                    <Zap size={24} className="text-yellow-300" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl">{campaign.name}</h3>
                                    <p className="text-white/90">Seçili ürünlerde %{config.discountPercent} indirim!</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg">
                                    <Clock size={18} />
                                    <span className="font-mono font-bold text-lg">{timeLeft[campaign.id] || 'Loading...'}</span>
                                </div>
                                <Link
                                    href="/products?flash_sale=true"
                                    className="bg-white text-red-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-md"
                                >
                                    İncele
                                </Link>
                            </div>
                        </div>
                    );
                }

                if (campaign.type === 'CATEGORY_DISCOUNT') {
                    return (
                        <div key={campaign.id} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="text-white/80" />
                                <div>
                                    <h3 className="font-bold text-lg">{campaign.name}</h3>
                                    <p className="text-sm text-white/90">Kategoride %{config.discountPercent} indirim fırsatı</p>
                                </div>
                            </div>
                            <Link
                                href={`/products?category=${config.categoryId}`}
                                className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                            >
                                Alışverişe Başla
                            </Link>
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}
