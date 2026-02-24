'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function AdminSliders() {
    const [slides, setSlides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        link: '',
        order: 0,
        isActive: true,
        image: null as File | null
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const res = await api.get('/hero-slides');
            setSlides(res.data);
        } catch (error) {
            console.error('Failed to fetch slides', error);
            // toast.error('Sliderlar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu slaytı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/hero-slides/${id}`);
            toast.success('Slayt silindi');
            fetchSlides();
        } catch (error) {
            toast.error('Silme işlemi başarısız');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data = new FormData();
        data.append('title', formData.title);
        data.append('subtitle', formData.subtitle || '');
        data.append('description', formData.description || '');
        data.append('link', formData.link || '');
        data.append('order', String(formData.order));
        data.append('isActive', String(formData.isActive));
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            if (editingId) {
                await api.put(`/hero-slides/${editingId}`, data);
                toast.success('Slayt güncellendi');
            } else {
                await api.post('/hero-slides', data);
                toast.success('Slayt eklendi');
            }
            setIsFormOpen(false);
            setEditingId(null);
            resetForm();
            fetchSlides();
        } catch (error) {
            console.error('Save failed', error);
            toast.error('Kaydetme başarısız');
        }
    };

    const handleEdit = (slide: { id: number; title: string; subtitle: string; description: string; link: string; order: number; isActive: boolean }) => {
        setEditingId(slide.id);
        setFormData({
            title: slide.title,
            subtitle: slide.subtitle,
            description: slide.description,
            link: slide.link,
            order: slide.order,
            isActive: slide.isActive,
            image: null
        });
        setIsFormOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            link: '',
            order: 0,
            isActive: true,
            image: null
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Vitrin / Slider Yönetimi</h1>
                <button
                    onClick={() => { setIsFormOpen(true); setEditingId(null); resetForm(); }}
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition-colors"
                >
                    <Plus size={20} /> Yeni Slayt Ekle
                </button>
            </div>

            {loading ? (
                <div className="text-center p-8"><Loader2 className="animate-spin inline-block" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {slides.map((slide) => (
                        <div key={slide.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-6 items-center">
                            <div className="relative w-full md:w-64 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <Image
                                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${slide.imageUrl}`}
                                    alt={slide.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                            <div className="flex-1 space-y-2 text-center md:text-left">
                                <h3 className="text-lg font-bold text-gray-900">{slide.title}</h3>
                                <p className="text-sm text-gray-500">{slide.description}</p>
                                <div className="flex gap-2 justify-center md:justify-start">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${slide.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {slide.isActive ? 'Aktif' : 'Pasif'}
                                    </span>
                                    <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">Sıra: {slide.order}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(slide)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <Edit size={20} />
                                </button>
                                <button onClick={() => handleDelete(slide.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {slides.length === 0 && <p className="text-center text-gray-500 py-8">Henüz slayt eklenmemiş.</p>}
                </div>
            )}

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingId ? 'Slaytı Düzenle' : 'Yeni Slayt Ekle'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Başlık</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Alt Başlık</label>
                                <input
                                    type="text"
                                    value={formData.subtitle}
                                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                    className="w-full border rounded p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Açıklama</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border rounded p-2"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Görsel</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                                    className="w-full border rounded p-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">Sadece değiştirilecekse yeni dosya seçin.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Sıra</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={e => setFormData({ ...formData, order: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-6">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <label className="text-sm font-medium">Aktif</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
