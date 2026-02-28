'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Trash2, Edit2, Plus, ChevronRight, ChevronDown, FolderTree, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
    id: number;
    name: string;
    image: string | null;
    parentId: number | null;
    sortOrder: number;
    _count?: { products: number };
    children?: Category[];
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ name: '', parentId: '' as string, sortOrder: '0' });
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories'); // Ağaç yapısında gelir
            setCategories(res.data);
            setExpandedIds(new Set(res.data.map((c: Category) => c.id)));
        } catch {
            toast.error('Kategoriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const openCreate = (parentId?: number) => {
        setEditingId(null);
        setForm({ name: '', parentId: parentId ? String(parentId) : '', sortOrder: '0' });
        setIsModalOpen(true);
    };

    const openEdit = (cat: Category) => {
        setEditingId(cat.id);
        setForm({
            name: cat.name,
            parentId: cat.parentId ? String(cat.parentId) : '',
            sortOrder: String(cat.sortOrder || 0),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;

        const payload = {
            name: form.name.trim(),
            parentId: form.parentId ? parseInt(form.parentId) : null,
            sortOrder: parseInt(form.sortOrder) || 0,
        };

        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, payload);
                toast.success('Kategori güncellendi');
            } else {
                await api.post('/categories', payload);
                toast.success('Kategori eklendi');
            }
            setIsModalOpen(false);
            fetchCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'İşlem başarısız');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Kategori silindi');
            fetchCategories();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Silme başarısız');
        }
    };

    const parentOptions = categories.filter(c => !c.parentId);

    const CategoryRow = ({ cat, depth = 0 }: { cat: Category; depth?: number }) => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isExpanded = expandedIds.has(cat.id);
        const isParent = depth === 0;
        const productCount = cat._count?.products || 0;

        return (
            <>
                <div
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${depth > 0 ? 'bg-gray-50/50' : ''}`}
                    style={{ paddingLeft: `${16 + depth * 32}px` }}
                >
                    <div className="w-6 shrink-0">
                        {hasChildren ? (
                            <button onClick={() => toggleExpand(cat.id)} className="p-0.5 hover:bg-gray-200 rounded">
                                {isExpanded
                                    ? <ChevronDown size={16} className="text-gray-500" />
                                    : <ChevronRight size={16} className="text-gray-500" />}
                            </button>
                        ) : isParent ? (
                            <div className="w-4" />
                        ) : (
                            <div className="w-4 h-px bg-gray-300 ml-1" />
                        )}
                    </div>

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isParent ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                        {isParent ? <FolderTree size={16} /> : <FolderOpen size={14} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <span className={`font-medium ${isParent ? 'text-gray-900' : 'text-gray-700 text-sm'}`}>{cat.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{productCount} ürün</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        {isParent && (
                            <button
                                onClick={() => openCreate(cat.id)}
                                className="text-xs text-primary hover:bg-primary/5 px-2 py-1 rounded-lg font-medium transition-colors"
                            >
                                + Alt Kategori
                            </button>
                        )}
                        <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                            <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {hasChildren && isExpanded && cat.children!.map(child => (
                    <CategoryRow key={child.id} cat={child} depth={depth + 1} />
                ))}
            </>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kategoriler</h1>
                    <p className="text-sm text-gray-500 mt-1">Ana kategoriler ve alt kategorileri yönetin.</p>
                </div>
                <button
                    onClick={() => openCreate()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium shadow-sm"
                >
                    <Plus size={18} /> Yeni Kategori
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FolderTree size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="font-semibold text-lg mb-1">Henüz kategori yok</p>
                        <p className="text-sm">İlk kategorinizi oluşturarak başlayın.</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <div className="w-6 shrink-0" />
                            <div className="w-8 shrink-0" />
                            <div className="flex-1">Kategori Adı</div>
                            <div className="w-44 shrink-0 text-right pr-2">İşlemler</div>
                        </div>
                        {categories.map(cat => <CategoryRow key={cat.id} cat={cat} />)}
                    </div>
                )}
            </div>

            {/* ═══ Modal ═══ */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h2 className="text-lg font-bold mb-4">{editingId ? 'Kategori Düzenle' : 'Yeni Kategori'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Adı</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                    placeholder="Örn: Kalemler"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Üst Kategori <span className="text-gray-400 font-normal">(opsiyonel)</span>
                                </label>
                                <select
                                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                    value={form.parentId}
                                    onChange={e => setForm({ ...form, parentId: e.target.value })}
                                >
                                    <option value="">Ana Kategori (Üst seviye)</option>
                                    {parentOptions.map(cat => (
                                        <option key={cat.id} value={cat.id} disabled={editingId === cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
                                <input
                                    type="number"
                                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                    value={form.sortOrder}
                                    onChange={e => setForm({ ...form, sortOrder: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-medium text-sm"
                                >
                                    {editingId ? 'Güncelle' : 'Oluştur'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
