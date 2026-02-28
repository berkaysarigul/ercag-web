'use client';

import { XCircle, CheckCircle, Package, User, Phone, Clock, FileText, Download, History, Store } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: { id: number; createdAt: string; fullName?: string; phoneNumber?: string; email?: string; user?: { name?: string; phone?: string; email?: string }; branch?: { name: string } | null; items: { id: number; quantity: number; price: number | string; product: { name: string } }[]; totalAmount: number | string; discountAmount?: number | string; campaignDiscount?: number | string; campaignDetails?: string; couponCode?: string; note?: string; status: string; statusHistory?: string | { status: string; date: string; user?: string; note?: string; timestamp?: string }[]; pickupCode?: string; completedAt?: string; readyAt?: string };
    onStatusChange: (orderId: number, status: string) => Promise<void>;
}

import { robotoBase64 } from '@/lib/robotoBase64';

import { useSettings } from "@/context/SettingsContext";

export default function OrderDetailsModal({ isOpen, onClose, order, onStatusChange }: OrderDetailsModalProps) {
    const { settings } = useSettings();
    if (!order) return null;

    const downloadInvoice = () => {
        const doc = new jsPDF();

        // Add Turkish font
        doc.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto');

        // Header
        doc.setFontSize(20);
        doc.text(settings.site_title || 'Erçağ Kırtasiye', 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Sipariş Fişi', 105, 22, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Sipariş No: #${order.id}`, 14, 35);
        doc.text(`Tarih: ${new Date(order.createdAt).toLocaleDateString('tr-TR')}`, 14, 40);

        doc.text(`Müşteri: ${order.fullName || order.user?.name}`, 120, 35);
        doc.text(`Telefon: ${order.phoneNumber || order.user?.phone}`, 120, 40);
        if (order.email || order.user?.email) {
            doc.text(`Email: ${order.email || order.user?.email}`, 120, 45);
        }

        // Table
        const tableColumn = ["Ürün", "Adet", "Birim Fiyat", "Toplam"];
        const tableRows: (string | number)[][] = [];

        order.items.forEach((item: { quantity: number; price: number | string; product: { name: string } }) => {
            const itemData = [
                item.product.name,
                item.quantity,
                `${Number(item.price).toFixed(2)} TL`,
                `${(item.quantity * Number(item.price)).toFixed(2)} TL`
            ];
            tableRows.push(itemData);
        });

        // @ts-ignore
        autoTable(doc, {
            startY: 55,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            styles: { font: 'Roboto', fontStyle: 'normal' }, // Apply font to table
            headStyles: { fillColor: [66, 66, 66] }
        });

        // Footer Totals
        // @ts-ignore
        const finalY = doc.lastAutoTable.finalY + 10;

        doc.text(`Ara Toplam: ${(Number(order.totalAmount) + (Number(order.discountAmount) || 0) + (Number(order.campaignDiscount) || 0)).toFixed(2)} TL`, 140, finalY);

        let yOffset = 0;

        if (order.campaignDiscount && Number(order.campaignDiscount) > 0) {
            yOffset += 5;
            doc.text(`Kampanya Indirimi: -${Number(order.campaignDiscount).toFixed(2)} TL`, 140, finalY + yOffset);
        }

        if (order.discountAmount && Number(order.discountAmount) > 0) {
            yOffset += 5;
            doc.text(`Kupon Indirimi: -${Number(order.discountAmount).toFixed(2)} TL`, 140, finalY + yOffset);
        }

        yOffset += 7;
        doc.setFontSize(12);
        // doc.setFont('helvetica', 'bold'); // Switch back to standard if needed or keep Roboto
        doc.setFont('Roboto', 'normal'); // Keep Roboto for consistency
        doc.text(`Genel Toplam: ${Number(order.totalAmount).toFixed(2)} TL`, 140, finalY + yOffset);

        doc.save(`ercag-siparis-${order.id}.pdf`);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">Bekliyor</span>;
            case 'PREPARING': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Hazırlanıyor</span>;
            case 'READY': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Hazır</span>;
            case 'COMPLETED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Tamamlandı</span>;
            case 'CANCELLED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">İptal</span>;
            default: return null;
        }
    };

    // Parse History
    let statusHistory: { status: string; date: string; user?: string; note?: string; timestamp?: string }[] = [];
    try {
        statusHistory = typeof order.statusHistory === 'string'
            ? JSON.parse(order.statusHistory)
            : order.statusHistory || [];
    } catch (e) {
        statusHistory = [];
    }
    // Reverse to show newest first
    statusHistory = [...statusHistory].reverse();

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-0 text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <DialogTitle as="h3" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Package className="text-primary-600" size={20} />
                                            Sipariş #{order.id}
                                        </DialogTitle>
                                        <div className="mt-1 flex gap-2">{getStatusBadge(order.status)}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={downloadInvoice}
                                            className="btn btn-sm bg-gray-900 text-white hover:bg-gray-800 flex items-center gap-2 shadow-sm"
                                        >
                                            <Download size={16} /> Fatura İndir
                                        </button>
                                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors ml-2">
                                            <XCircle size={28} />
                                        </button>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                                    <div className="grid md:grid-cols-3 gap-8">
                                        {/* Left Column: Details (2 cols wide) */}
                                        <div className="md:col-span-2 space-y-8">

                                            {/* Customer & Order Data in Grid */}
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Müşteri Bilgileri</h4>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                                <User size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{order.fullName || order.user?.name}</p>
                                                                <p className="text-sm text-gray-500">{order.email || order.user?.email}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-gray-600">
                                                            <Phone size={16} />
                                                            <span>{order.phoneNumber || order.user?.phone}</span>
                                                        </div>
                                                        {order.branch && (
                                                            <div className="flex items-center gap-3 text-emerald-600 mt-2 font-medium bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50 w-fit">
                                                                <Store size={16} />
                                                                <span>{order.branch.name} Şubesi</span>
                                                            </div>
                                                        )}
                                                        {order.pickupCode && (
                                                            <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-primary/10 text-center">
                                                                <p className="text-xs text-primary mb-1">Teslimat Kodu</p>
                                                                <button
                                                                    onClick={() => { navigator.clipboard.writeText(order.pickupCode || ''); toast?.('Kod kopyalandı!'); }}
                                                                    className="text-xl font-mono font-bold text-primary tracking-widest hover:opacity-70 transition-opacity cursor-pointer"
                                                                    title="Tıkla kopyala"
                                                                >
                                                                    {order.pickupCode}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Notlar</h4>
                                                    {order.note ? (
                                                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-sm italic text-gray-600 flex gap-2">
                                                            <FileText size={16} className="shrink-0 mt-0.5" />
                                                            <p>"{order.note}"</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-400 italic text-sm">Not bulunmuyor.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Products */}
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Ürünler ({order.items.length})</h4>
                                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                                    {order.items.map((item: { id: number; quantity: number; price: number | string; product: { name: string } }) => (
                                                        <div key={item.id} className="flex justify-between items-start border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                                                            <div className="flex gap-3">
                                                                <span className="font-mono bg-white px-2 rounded border border-gray-200 text-sm text-gray-600 h-fit shadow-sm">
                                                                    {item.quantity}x
                                                                </span>
                                                                <span className="text-sm font-medium text-gray-900 line-clamp-2">{item.product.name}</span>
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                                                ₺{Number(item.price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-4 space-y-2 flex flex-col items-end">
                                                    {order.campaignDiscount && Number(order.campaignDiscount) > 0 && (
                                                        <div className="flex justify-between w-48 text-sm text-orange-600">
                                                            <span>Kampanya</span>
                                                            <span>-₺{Number(order.campaignDiscount).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    {order.discountAmount && Number(order.discountAmount) > 0 && (
                                                        <div className="flex justify-between w-48 text-sm text-green-600">
                                                            <span>İndirim ({order.couponCode})</span>
                                                            <span>-₺{Number(order.discountAmount).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between w-48 text-lg font-bold text-primary-600 border-t pt-2">
                                                        <span>Toplam</span>
                                                        <span>₺{Number(order.totalAmount).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: History & Metadata (1 col wide) */}
                                        <div className="md:col-span-1 border-l border-gray-100 pl-8 space-y-8">
                                            <div>
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <History size={14} /> Sipariş Geçmişi
                                                </h4>
                                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-100 before:to-transparent">
                                                    {statusHistory.map((log: { status: string; date?: string; timestamp?: string; user?: string; note?: string }, index: number) => (
                                                        <div key={index} className="relative pl-6">
                                                            <span className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm
                                                                ${log.status === 'COMPLETED' ? 'bg-green-500' :
                                                                    log.status === 'CANCELLED' ? 'bg-red-500' : 'bg-gray-400'}`}>
                                                            </span>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {log.status === 'PENDING' ? 'Sipariş Alındı' :
                                                                        log.status === 'PREPARING' ? 'Hazırlanıyor' :
                                                                            log.status === 'READY' ? 'Teslime Hazır' :
                                                                                log.status === 'COMPLETED' ? 'Teslim Edildi' :
                                                                                    log.status === 'CANCELLED' ? 'İptal Edildi' : log.status}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date((log.timestamp || log.date) as string).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {log.note && <span className="text-xs text-gray-500 italic mt-0.5">"{log.note}"</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="relative pl-6">
                                                        <span className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-gray-200 border-2 border-white"></span>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-gray-500">Oluşturuldu</span>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(order.createdAt).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-gray-100">
                                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Zaman Çizelgesi</h4>
                                                <div className="space-y-2 text-xs text-gray-600">
                                                    <div className="flex justify-between">
                                                        <span>Kayıt:</span>
                                                        <span>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                                                    </div>
                                                    {order.completedAt && (
                                                        <div className="flex justify-between text-green-600 font-medium">
                                                            <span>Bitiş:</span>
                                                            <span>{new Date(order.completedAt).toLocaleDateString('tr-TR')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-3 border-t border-gray-100">
                                    <div className="text-sm text-gray-500 hidden md:block">
                                        Durum değişikliği müşteriye SMS/Email olarak bildirilir.
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        {order.status === 'PENDING' && (
                                            <>
                                                <button onClick={() => onStatusChange(order.id, 'CANCELLED')} className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">İptal Et</button>
                                                <button onClick={() => onStatusChange(order.id, 'PREPARING')} className="btn bg-blue-600 hover:bg-blue-700 text-white shadow-md">Hazırla</button>
                                            </>
                                        )}
                                        {order.status === 'PREPARING' && (
                                            <>
                                                <button onClick={() => onStatusChange(order.id, 'CANCELLED')} className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">İptal Et</button>
                                                <button onClick={() => onStatusChange(order.id, 'READY')} className="btn bg-amber-500 hover:bg-amber-600 text-white shadow-md">Hazır İşaretle</button>
                                            </>
                                        )}
                                        {order.status === 'READY' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Siparişi iptal etmek istediğinize emin misiniz?')) onStatusChange(order.id, 'CANCELLED');
                                                    }}
                                                    className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                >
                                                    İptal Et
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Bu siparişi TAMAMLANDI olarak işaretlemek istediğinize emin misiniz?')) onStatusChange(order.id, 'COMPLETED');
                                                    }}
                                                    className="btn bg-green-600 hover:bg-green-700 text-white shadow-md"
                                                >
                                                    Teslim Et
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
