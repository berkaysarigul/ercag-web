import { Percent, Gift, Truck, DollarSign } from 'lucide-react';

export default function ProductBadge({ campaign }: { campaign: any }) {
    if (!campaign) return null;

    let icon = <Percent size={12} />;
    let text = '';
    let color = 'bg-red-500';

    switch (campaign.type) {
        case 'PERCENTAGE_OFF':
            text = `%${campaign.value} İndirim`;
            color = 'bg-red-500';
            break;
        case 'BOGO':
            text = '1 Alana 1 Hediye';
            icon = <Gift size={12} />;
            color = 'bg-purple-500';
            break;
        case 'FIXED_AMOUNT':
            text = `${campaign.value}₺ İndirim`;
            icon = <DollarSign size={12} />;
            color = 'bg-green-500';
            break;
        case 'FREE_SHIPPING':
            // Usually not per product, but if specific
            text = 'Kargo Bedava';
            icon = <Truck size={12} />;
            color = 'bg-orange-500';
            break;
    }

    return (
        <div className={`absolute top-2 left-2 z-10 ${color} text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm`}>
            {icon}
            {text}
        </div>
    );
}
