'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import api from '@/lib/api';

interface ReviewFormProps {
    productId: number;
    onReviewAdded: () => void;
}

export default function ReviewForm({ productId, onReviewAdded }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Lütfen bir puan verin.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await api.post('/reviews', {
                productId,
                rating,
                comment
            });
            setRating(0);
            setComment('');
            onReviewAdded();
        } catch (err: unknown) {
            const errResponse = (err as any)?.response;
            setError(errResponse?.data?.error || 'Yorum gönderilirken bir hata oluştu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 p-6 rounded-xl border mb-8">
            <h3 className="text-lg font-bold mb-4">Yorum Yap</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puanınız</label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="focus:outline-none"
                            >
                                <Star
                                    size={24}
                                    className={
                                        star <= (hoverRating || rating)
                                            ? "fill-yellow-400 text-yellow-400 transition-colors"
                                            : "text-gray-300 transition-colors"
                                    }
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Yorumunuz (İsteğe bağlı)</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none"
                        rows={3}
                        placeholder="Ürün hakkında düşünceleriniz..."
                    />
                </div>

                {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary w-full md:w-auto px-8"
                >
                    {isSubmitting ? 'Gönderiliyor...' : 'Yorumu Gönder'}
                </button>
            </form>
        </div>
    );
}
