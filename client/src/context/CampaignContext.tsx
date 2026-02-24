'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

interface CampaignConfig {
    discountPercent?: number;
    categoryId?: number;
    productIds?: number[];
    buyQuantity?: number;
    payQuantity?: number;
}

interface Campaign {
    id: number;
    name: string;
    type: 'FLASH_SALE' | 'CATEGORY_DISCOUNT' | 'BUY_X_GET_Y';
    config: CampaignConfig;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

interface ProductDiscount {
    discountedPrice: number;
    discountPercent: number;
    campaignName: string;
    campaignType: string;
}

interface CampaignContextType {
    campaigns: Campaign[];
    getProductDiscount: (productId: number, categoryId?: number | null, price?: number) => ProductDiscount | null;
}

const CampaignContext = createContext<CampaignContextType>({
    campaigns: [],
    getProductDiscount: () => null,
});

export function CampaignProvider({ children }: { children: React.ReactNode }) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);

    useEffect(() => {
        api.get('/campaigns/public')
            .then(res => {
                // Parse config JSON strings
                const parsed = res.data.map((c: { config: string | CampaignConfig;[key: string]: unknown }) => ({
                    ...c,
                    config: typeof c.config === 'string' ? JSON.parse(c.config) : c.config,
                })) as Campaign[];
                setCampaigns(parsed);
            })
            .catch(() => { });
    }, []);

    const getProductDiscount = useCallback((
        productId: number,
        categoryId?: number | null,
        price?: number
    ): ProductDiscount | null => {
        if (!price || campaigns.length === 0) return null;

        // Check FLASH_SALE first (higher priority)
        for (const campaign of campaigns) {
            if (campaign.type === 'FLASH_SALE') {
                const ids = campaign.config.productIds || [];
                if (ids.includes(productId)) {
                    const pct = campaign.config.discountPercent || 0;
                    return {
                        discountedPrice: price * (1 - pct / 100),
                        discountPercent: pct,
                        campaignName: campaign.name,
                        campaignType: 'FLASH_SALE',
                    };
                }
            }
        }

        // Check CATEGORY_DISCOUNT
        if (categoryId) {
            for (const campaign of campaigns) {
                if (campaign.type === 'CATEGORY_DISCOUNT') {
                    if (campaign.config.categoryId === categoryId) {
                        const pct = campaign.config.discountPercent || 0;
                        return {
                            discountedPrice: price * (1 - pct / 100),
                            discountPercent: pct,
                            campaignName: campaign.name,
                            campaignType: 'CATEGORY_DISCOUNT',
                        };
                    }
                }
            }
        }

        return null;
    }, [campaigns]);

    return (
        <CampaignContext.Provider value={{ campaigns, getProductDiscount }}>
            {children}
        </CampaignContext.Provider>
    );
}

export function useCampaigns() {
    return useContext(CampaignContext);
}
