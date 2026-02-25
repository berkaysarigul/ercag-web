'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Trash2, Edit2, Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
    id: number;
    name: string;
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
            toast.error('Kategoriler yüklenemedi');
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setLoading(true);
        try {
            await api.post('/categories', { name: newCategoryName });
            setNewCategoryName('');
            toast.success('Kategori eklendi');
            fetchCategories();
        } catch (error) {
            console.error('Failed to add category', error);
            toast.error('Kategori eklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz? (Ürünleri etkileyebilir)')) return;

        try {
            await api.delete(`/categories/${id}`);
            toast.success('Kategori silindi');
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (error: unknown) {
            const errResponse = (error as any)?.response;
            toast.error(errResponse?.data?.error || 'Silme işlemi başarısız');
        }
    };

    const startEdit = (category: Category) => {
        setEditingId(category.id);
        setEditName(category.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEdit = async (id: number) => {
        if (!editName.trim()) return;

        try {
            await api.put(`/categories/${id}`, { name: editName });
            toast.success('Kategori güncellendi');
            setEditingId(null);
            fetchCategories();
        } catch (error: unknown) {
            toast.error('Güncelleme başarısız');
        }
    };

    return (
        <div className="p-8 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Kategoriler</h1>

            {/* Add Category */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-600" />
                    Yeni Kategori Ekle
                </h3>
                <form onSubmit={handleAddCategory} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Kategori Adı (Örn: Kırtasiye)"
                        className="input flex-1"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm" disabled={loading}>
                        {loading ? 'Ekleniyor...' : 'Ekle'}
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <ul className="divide-y divide-gray-100">
                    {categories.map((cat) => (
                        <li key={cat.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            {editingId === cat.id ? (
                                <div className="flex items-center gap-3 flex-1 mr-4">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="input flex-1 h-10"
                                        autoFocus
                                    />
                                    <button onClick={() => saveEdit(cat.id)} className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors" title="Kaydet">
                                        <Save size={20} />
                                    </button>
                                    <button onClick={cancelEdit} className="text-gray-400 hover:bg-gray-100 p-2 rounded-lg transition-colors" title="İptal">
                                        <X size={20} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="font-medium text-gray-900 px-2">{cat.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400 mr-2 bg-gray-100 px-2 py-1 rounded">ID: {cat.id}</span>
                                        <button
                                            onClick={() => startEdit(cat)}
                                            className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                            title="Düzenle"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                    {categories.length === 0 && (
                        <li className="p-8 text-center text-gray-500">
                            Henüz kategori eklenmemiş.
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}
