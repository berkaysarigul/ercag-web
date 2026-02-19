'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Trash2, MessageSquare, Star, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Review {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
    product: {
        id: number;
        name: string;
    };
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await api.get('/reviews'); // Admin route returning all
            setReviews(res.data);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
            toast.error('Yorumlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;

        try {
            await api.delete(`/reviews/${id}`);
            toast.success('Yorum silindi');
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Silme işlemi başarısız');
        }
    };

    if (loading) return <div className="p-8">Yükleniyor...</div>;

    return (
        <div className="p-8 max-w-6xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <MessageSquare className="text-primary" />
                Değerlendirmeler
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Ürün</th>
                                <th className="p-4 font-semibold text-gray-600">Kullanıcı</th>
                                <th className="p-4 font-semibold text-gray-600">Puan</th>
                                <th className="p-4 font-semibold text-gray-600">Yorum</th>
                                <th className="p-4 font-semibold text-gray-600">Tarih</th>
                                <th className="p-4 font-semibold text-gray-600">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {reviews.map((review) => (
                                <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <Link href={`/products/${review.product.id}`} target="_blank" className="font-medium text-blue-600 hover:underline flex items-center gap-1">
                                            {review.product.name}
                                            <ExternalLink size={14} />
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{review.user.name}</div>
                                        <div className="text-xs text-gray-500">{review.user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex text-yellow-400">
                                            {'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}
                                        </div>
                                    </td>
                                    <td className="p-4 max-w-xs truncate" title={review.comment}>
                                        {review.comment}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {reviews.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Henüz değerlendirme yapılmamış.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
