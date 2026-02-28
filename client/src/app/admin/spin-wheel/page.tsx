'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, ToggleRight, ToggleLeft, Gift, Copy, Ticket } from 'lucide-react';
import { toast } from 'sonner';

interface Prize { id: number; name: string; type: string; value: string | null; probability: number; color: string | null; icon: string | null; maxWins: number | null; winCount: number; }
interface Wheel { id: number; name: string; minOrderAmount: number; isActive: boolean; isManualOnly: boolean; prizes: Prize[]; _count: { codes: number }; }
interface SpinCode { id: number; code: string; isUsed: boolean; usedAt: string | null; customerNote: string | null; wheel: { name: string }; prize: { name: string } | null; createdAt: string; }

const PRIZE_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7CB342'];
const PRIZE_TYPES = [
    { value: 'COUPON', label: 'İndirim Kuponu' },
    { value: 'POINTS', label: 'Sadakat Puanı' },
    { value: 'PRODUCT', label: 'Ürün Hediye' },
    { value: 'EMPTY', label: 'Boş (Kazanamadı)' },
];

export default function AdminSpinWheelPage() {
    const [wheels, setWheels] = useState<Wheel[]>([]);
    const [codes, setCodes] = useState<SpinCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'wheels' | 'codes' | 'generate'>('wheels');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [wheelForm, setWheelForm] = useState({
        name: '', minOrderAmount: '0', isManualOnly: false,
        prizes: [
            { name: '', type: 'COUPON', value: '', probability: '0.25', color: PRIZE_COLORS[0], maxWins: '' },
            { name: '', type: 'EMPTY', value: '', probability: '0.75', color: PRIZE_COLORS[6], maxWins: '' },
        ],
    });

    const [genForm, setGenForm] = useState({ wheelId: '', customerNote: '' });
    const [generatedCode, setGeneratedCode] = useState('');

    const fetchWheels = async () => {
        try { const r = await api.get('/spin/wheels'); setWheels(r.data); }
        catch { toast.error('Çarklar yüklenemedi'); }
        finally { setLoading(false); }
    };
    const fetchCodes = async () => {
        try { const r = await api.get('/spin/codes'); setCodes(r.data); }
        catch { toast.error('Kodlar yüklenemedi'); }
    };

    useEffect(() => { fetchWheels(); }, []);
    useEffect(() => { if (tab === 'codes') fetchCodes(); }, [tab]);

    const addPrize = () => {
        setWheelForm(prev => ({
            ...prev,
            prizes: [...prev.prizes, { name: '', type: 'EMPTY', value: '', probability: '0', color: PRIZE_COLORS[prev.prizes.length % PRIZE_COLORS.length], maxWins: '' }],
        }));
    };

    const removePrize = (idx: number) => {
        setWheelForm(prev => ({ ...prev, prizes: prev.prizes.filter((_, i) => i !== idx) }));
    };

    const updatePrize = (idx: number, field: string, val: string) => {
        setWheelForm(prev => ({
            ...prev,
            prizes: prev.prizes.map((p, i) => i === idx ? { ...p, [field]: val } : p),
        }));
    };

    const totalProb = wheelForm.prizes.reduce((s, p) => s + (parseFloat(p.probability) || 0), 0);

    const handleCreateWheel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Math.abs(totalProb - 1) > 0.01) { toast.error('Toplam olasılık %100 olmalı'); return; }
        try {
            await api.post('/spin/wheels', wheelForm);
            toast.success('Çark oluşturuldu');
            setIsModalOpen(false);
            setWheelForm({ name: '', minOrderAmount: '0', isManualOnly: false, prizes: [{ name: '', type: 'COUPON', value: '', probability: '0.25', color: PRIZE_COLORS[0], maxWins: '' }, { name: '', type: 'EMPTY', value: '', probability: '0.75', color: PRIZE_COLORS[6], maxWins: '' }] });
            fetchWheels();
        } catch (err: any) { toast.error(err.response?.data?.error || 'Hata'); }
    };

    const handleToggle = async (w: Wheel) => {
        try { await api.put(`/spin/wheels/${w.id}`, { isActive: !w.isActive }); fetchWheels(); }
        catch { toast.error('Güncelleme başarısız'); }
    };

    const handleDeleteWheel = async (id: number) => {
        if (!confirm('Çarkı ve tüm kodlarını silmek istediğinize emin misiniz?')) return;
        try { await api.delete(`/spin/wheels/${id}`); toast.success('Silindi'); fetchWheels(); }
        catch { toast.error('Silinemedi'); }
    };

    const handleGenerateCode = async () => {
        if (!genForm.wheelId) { toast.error('Çark seçin'); return; }
        try {
            const r = await api.post('/spin/codes/generate', genForm);
            setGeneratedCode(r.data.code);
            toast.success('Kod oluşturuldu');
        } catch (err: any) { toast.error(err.response?.data?.error || 'Hata'); }
    };

    const copyCode = () => { navigator.clipboard.writeText(generatedCode); toast.success('Kopyalandı'); };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Hediye Çarkı</h1>
                <p className="text-sm text-gray-500 mt-1">Çark ödülleri, kodlar ve mağaza içi kod üretimi.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {[
                    { key: 'wheels', label: 'Çarklar', icon: Gift },
                    { key: 'generate', label: 'Kod Üret', icon: Ticket },
                    { key: 'codes', label: 'Kod Geçmişi', icon: Copy },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key as 'wheels' | 'codes' | 'generate')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-gray-800'}`}>
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {/* ═══ ÇARKLAR TAB ═══ */}
            {tab === 'wheels' && (
                <div className="space-y-4">
                    <button onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium text-sm">
                        <Plus size={16} /> Yeni Çark
                    </button>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
                        </div>
                    ) : wheels.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Gift size={40} className="mx-auto mb-3 opacity-30" />
                            <p>Henüz çark yok. Yeni bir çark oluşturun.</p>
                        </div>
                    ) : wheels.map(w => (
                        <div key={w.id} className={`bg-white rounded-xl border p-5 shadow-sm transition-opacity ${!w.isActive ? 'opacity-50' : ''}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900">{w.name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Min: {w.minOrderAmount} ₺ · {w._count.codes} kod üretildi · {w.isManualOnly ? 'Sadece Manuel' : 'Otomatik + Manuel'}
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleToggle(w)} className={`p-2 rounded-lg transition-colors ${w.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                                        {w.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                    </button>
                                    <button onClick={() => handleDeleteWheel(w.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {w.prizes.map(p => (
                                    <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
                                        style={{ borderColor: p.color || '#ccc', backgroundColor: (p.color || '#ccc') + '20' }}>
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || '#ccc' }} />
                                        {p.name} — %{(p.probability * 100).toFixed(0)}
                                        {p.maxWins && <span className="text-gray-400 ml-1">(max: {p.maxWins}, kazanılan: {p.winCount})</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ KOD ÜRET TAB ═══ */}
            {tab === 'generate' && (
                <div className="bg-white rounded-xl border p-6 shadow-sm max-w-md space-y-4">
                    <h3 className="font-bold text-gray-900">Mağaza İçi Kod Üret</h3>
                    <p className="text-sm text-gray-500">Fiziksel mağazadan alışveriş yapan müşteriye çark kodu verin.</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Çark Seçin</label>
                        <select className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                            value={genForm.wheelId} onChange={e => setGenForm({ ...genForm, wheelId: e.target.value })}>
                            <option value="">Çark seçin...</option>
                            {wheels.filter(w => w.isActive).map(w => (
                                <option key={w.id} value={w.id}>{w.name} (Min: {w.minOrderAmount} ₺)</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Not <span className="text-gray-400 font-normal">(opsiyonel)</span>
                        </label>
                        <input type="text" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                            placeholder="Örn: 3200TL alışveriş - Ahmet Bey"
                            value={genForm.customerNote} onChange={e => setGenForm({ ...genForm, customerNote: e.target.value })} />
                    </div>
                    <button onClick={handleGenerateCode}
                        className="w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors">
                        Kod Oluştur
                    </button>

                    {generatedCode && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                            <p className="text-sm text-green-700 mb-2">Müşteriye bu kodu verin:</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl font-mono font-bold text-green-900 tracking-wider">{generatedCode}</span>
                                <button onClick={copyCode} className="p-1.5 hover:bg-green-100 rounded-lg text-green-600 transition-colors">
                                    <Copy size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-green-600 mt-2">Müşteri bu kodu siteye girip çarkı çevirebilir.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ KOD GEÇMİŞİ TAB ═══ */}
            {tab === 'codes' && (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Kod</th>
                                    <th className="px-4 py-3 text-left">Çark</th>
                                    <th className="px-4 py-3 text-left">Durum</th>
                                    <th className="px-4 py-3 text-left">Ödül</th>
                                    <th className="px-4 py-3 text-left">Not</th>
                                    <th className="px-4 py-3 text-left">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {codes.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Henüz kod yok</td></tr>
                                ) : codes.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-mono font-bold text-xs">{c.code}</td>
                                        <td className="px-4 py-3">{c.wheel.name}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isUsed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {c.isUsed ? 'Kullanıldı' : 'Bekliyor'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{c.prize?.name || '—'}</td>
                                        <td className="px-4 py-3 text-gray-400 truncate max-w-[150px]">{c.customerNote || '—'}</td>
                                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString('tr-TR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ YENİ ÇARK MODAL ═══ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto"
                    onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8">
                        <h2 className="text-lg font-bold mb-4">Yeni Çark Oluştur</h2>
                        <form onSubmit={handleCreateWheel} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Çark Adı</label>
                                    <input required type="text" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                                        placeholder="3000 TL Çarkı"
                                        value={wheelForm.name} onChange={e => setWheelForm({ ...wheelForm, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Min. Sipariş Tutarı (₺)</label>
                                    <input type="number" className="w-full border border-gray-200 rounded-xl p-2.5 text-sm"
                                        placeholder="3000"
                                        value={wheelForm.minOrderAmount} onChange={e => setWheelForm({ ...wheelForm, minOrderAmount: e.target.value })} />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="checkbox" checked={wheelForm.isManualOnly}
                                    onChange={e => setWheelForm({ ...wheelForm, isManualOnly: e.target.checked })} />
                                Sadece manuel kod üretimi (otomatik sipariş kodu oluşturma)
                            </label>

                            {/* Ödül Dilimleri */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-semibold text-gray-700">Ödül Dilimleri</label>
                                    <span className={`text-xs font-bold ${Math.abs(totalProb - 1) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                                        Toplam: %{(totalProb * 100).toFixed(0)} {Math.abs(totalProb - 1) < 0.01 ? '✓' : '← 100 olmalı!'}
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {wheelForm.prizes.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                                            <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 shrink-0"
                                                value={p.color} onChange={e => updatePrize(idx, 'color', e.target.value)} />
                                            <input type="text" placeholder="Ödül adı" className="flex-1 border border-gray-200 rounded-lg p-2 text-sm" required
                                                value={p.name} onChange={e => updatePrize(idx, 'name', e.target.value)} />
                                            <select className="border border-gray-200 rounded-lg p-2 text-sm w-36 shrink-0"
                                                value={p.type} onChange={e => updatePrize(idx, 'type', e.target.value)}>
                                                {PRIZE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                            {p.type !== 'EMPTY' && (
                                                <input type="text" placeholder="Değer" className="border border-gray-200 rounded-lg p-2 text-sm w-20 shrink-0"
                                                    value={p.value} onChange={e => updatePrize(idx, 'value', e.target.value)} />
                                            )}
                                            <input type="number" step="0.01" min="0" max="1" placeholder="0.25"
                                                className="border border-gray-200 rounded-lg p-2 text-sm w-20 shrink-0"
                                                value={p.probability} onChange={e => updatePrize(idx, 'probability', e.target.value)} />
                                            <button type="button" onClick={() => removePrize(idx)} className="text-red-400 hover:text-red-600 shrink-0">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addPrize} className="mt-2 text-sm text-primary font-medium hover:underline">
                                    + Dilim Ekle
                                </button>
                            </div>

                            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors">
                                    İptal
                                </button>
                                <button type="submit"
                                    className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark text-sm font-medium transition-colors">
                                    Oluştur
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
