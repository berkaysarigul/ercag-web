'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Category {
    id: number;
    name: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '100', // Default stock
        categoryId: '',
    });
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        api.get('/categories').then(res => setCategories(res.data));
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImages(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
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

        images.forEach((file) => {
            data.append('images', file);
        });

        try {
            await api.post('/products', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Ürün başarıyla eklendi');
            router.push('/admin/products');
        } catch (error) {
            console.error('Failed to create product', error);
            toast.error('Ürün eklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Yeni Ürün Ekle</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Image & Basic Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Görselleri</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="py-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                            <Upload size={24} />
                                        </div>
                                        <p className="text-sm text-gray-500">Görselleri yüklemek için tıklayın veya sürükleyin</p>
                                        <p className="text-xs text-gray-400 mt-1">Birden fazla dosya seçebilirsiniz</p>
                                    </div>
                                </div>

                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="relative aspect-square border rounded-lg overflow-hidden group">
                                                <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                                />
                            </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                                <textarea
                                    required
                                    className="input w-full min-h-[120px]"
                                    placeholder="Ürün özelliklerini detaylıca yazınız..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
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
                                    <Save size={20} /> Ürünü Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
