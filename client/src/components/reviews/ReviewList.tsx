'use client';

import { Star } from 'lucide-react';

interface Review {
    id: number;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: {
        name: string;
    };
}

export default function ReviewList({ reviews }: { reviews: Review[] }) {
    if (reviews.length === 0) {
        return <div className="text-gray-500 text-center py-8">Henüz yorum yapılmamış. İlk yorumu sen yap!</div>;
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs text-gray-600">
                                {review.user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium">{review.user.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                    </div>
                    <div className="flex items-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={16}
                                className={star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                            />
                        ))}
                    </div>
                    {review.comment && <p className="text-gray-600">{review.comment}</p>}
                </div>
            ))}
        </div>
    );
}
