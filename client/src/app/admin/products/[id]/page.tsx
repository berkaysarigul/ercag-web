'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';

interface Category {
    id: number;
    name: string;
}

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        categoryId: '',
    });
    const [newImages, setNewImages] = useState<File[]>([]);
    const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<{ id: number; url: string; isMain: boolean }[]>([]);
    const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

    // ... useEffect ...

    const handleExistingImageDelete = (id: number) => {
        if (!confirm('Bu görseli silmek istiyor musunuz?')) return;
        setDeletedImageIds(prev => [...prev, id]);
        setExistingImages(prev => prev.filter(img => img.id !== id));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, prodRes] = await Promise.all([
                    api.get('/categories'),
                    api.get(`/products/${id}`)
                ]);
                setCategories(catRes.data);

                const product = prodRes.data;
                setFormData({
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    stock: (product.stock || 0).toString(),
                    categoryId: product.categoryId.toString()
                });

                // Populate existing images
                if (product.images && product.images.length > 0) {
                    setExistingImages(product.images);
                } else if (product.image) {
                    // Fallback for legacy single image
                    setExistingImages([{ id: 0, url: product.image, isMain: true }]);
                }
            } catch (error) {
                console.error('Failed to fetch data', error);
                toast.error('Ürün bilgileri yüklenemedi');
                router.push('/admin/products');
            } finally {
                setFetching(false);
            }
        };
        if (id) {
            fetchData();
        }
    }, [id, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewImages(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setNewImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.categoryId) {
            toast.error('Lütfen bir kategori seçiniz.');
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('stock', formData.stock);
        data.append('categoryId', formData.categoryId);
        if (deletedImageIds.length > 0) {
            data.append('deletedImageIds', JSON.stringify(deletedImageIds));
        }

        newImages.forEach((file) => {
            data.append('images', file);
        });

        try {
            await api.put(`/products/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Ürün başarıyla güncellendi');
            router.push('/admin/products');
        } catch (error) {
            console.error('Failed to update product', error);
            toast.error('Ürün güncellenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Ürünü Düzenle</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Image & Basic Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Görseli</label>
                                <ImageUpload
                                    onImagesSelected={(files) => {
                                        setNewImages(prev => [...prev, ...files]);
                                        const newPreviews = files.map(file => URL.createObjectURL(file));
                                        setNewImagePreviews(prev => [...prev, ...newPreviews]);
                                    }}
                                />

                                <div className="mt-4 space-y-4">
                                    {/* Existing Images */}
                                    {existingImages.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Mevcut Görseller</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {existingImages.map((img, index) => (
                                                    <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group">
                                                        <img
                                                            src={img.url.startsWith('http') ? img.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${img.url.startsWith('/') ? '' : '/uploads/'}${img.url}`}
                                                            alt={`Existing ${index}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleExistingImageDelete(img.id)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                            title="Sil"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* New Images */}
                                    {newImagePreviews.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-green-600 mb-2 uppercase">Yeni Eklenecekler</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {newImagePreviews.map((preview, index) => (
                                                    <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group border-green-200">
                                                        <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeNewImage(index)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transition-opacity"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Adı</label>
                                <input
                                    type="text"
                                    required
                                    className="input w-full"
                                    placeholder="Örn: Faber-Castell 12'li Boya Kalemi"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                />
                            </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                                <RichTextEditor
                                    value={formData.description}
                                    onChange={(value) => setFormData({ ...formData, description: value })}
                                    placeholder="Ürün özelliklerini detaylıca yazınız..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat (TL)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        min="0"
                                        className="input w-full"
                                        placeholder="0.00"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Stok Adedi</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="input w-full"
                                        placeholder="0"
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                                <select
                                    required
                                    className="input w-full"
                                    value={formData.categoryId}
                                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                                >
                                    <option value="">Kategori Seçiniz</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary px-8 py-3 flex items-center gap-2 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        >
                            {loading ? 'Kaydediliyor...' : (
                                <>
                                    <Save size={20} /> Değişiklikleri Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
