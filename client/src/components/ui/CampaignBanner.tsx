'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CampaignBanner() {
    const [campaigns, setCampaigns] = useState([]);

    useEffect(() => {
        const fetchActiveCampaigns = async () => {
            try {
                // Ensure there's a public route or use the authenticated one if user is logged in
                // For public homepage, best to have a public endpoint.
                // Re-using the /campaigns/public endpoint we created.
                const res = await api.get('/campaigns/public');
                setCampaigns(res.data);
            } catch (error) {
                console.error('Failed to fetch campaigns');
            }
        };
        fetchActiveCampaigns();
    }, []);

    if (campaigns.length === 0) return null;

    // Show only the first active campaign for now, or a slider
    const campaign = campaigns[0] as any;

    return (
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-3 shadow-md">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="bg-white/20 p-1.5 rounded-lg">
                        <AlertCircle size={18} />
                    </span>
                    <div>
                        <p className="font-bold text-sm md:text-base">{campaign.name}</p>
                        <p className="text-xs md:text-sm text-white/80">{campaign.description}</p>
                    </div>
                </div>
                <Link href="/products" className="text-xs md:text-sm font-medium bg-white text-primary-700 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1">
                    Alışverişe Başla <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}
