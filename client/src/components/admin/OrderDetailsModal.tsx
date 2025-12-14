'use client';

import { XCircle, CheckCircle, Package, User, Phone, Clock, FileText } from 'lucide-react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    onStatusChange: (orderId: number, status: string) => Promise<void>;
}

export default function OrderDetailsModal({ isOpen, onClose, order, onStatusChange }: OrderDetailsModalProps) {
    if (!order) return null;

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
                            <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-0 text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <DialogTitle as="h3" className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Package className="text-primary-600" size={20} />
                                            Sipariş #{order.id}
                                        </DialogTitle>
                                        <div className="mt-1 flex gap-2">{getStatusBadge(order.status)}</div>
                                    </div>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        <XCircle size={28} />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                                        {/* Customer Info */}
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
                                                {order.pickupCode && (
                                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                                                        <p className="text-xs text-blue-600 mb-1">Teslimat Kodu</p>
                                                        <p className="text-xl font-mono font-bold text-blue-800 tracking-widest">{order.pickupCode}</p>
                                                    </div>
                                                )}
                                                {order.note && (
                                                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-sm italic text-gray-600 flex gap-2">
                                                        <FileText size={16} className="shrink-0 mt-0.5" />
                                                        <p>"{order.note}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div>
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Ürünler ({order.items.length})</h4>
                                            <div className="space-y-2">
                                                {order.items.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-start p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                        <div className="flex gap-3">
                                                            <span className="font-mono bg-gray-100 px-2 rounded text-sm text-gray-600 h-fit">
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

                                            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                                                {order.discountAmount > 0 && (
                                                    <div className="flex justify-between text-sm text-green-600">
                                                        <span>İndirim ({order.couponCode})</span>
                                                        <span>-₺{Number(order.discountAmount).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-lg font-bold text-primary-600">
                                                    <span>Toplam</span>
                                                    <span>₺{Number(order.totalAmount).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline / Dates */}
                                    <div className="text-xs text-gray-400 flex gap-4 pt-4 border-t border-gray-100">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> Oluşturuldu: {new Date(order.createdAt).toLocaleString('tr-TR')}
                                        </span>
                                        {order.completedAt && (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle size={12} /> Teslim: {new Date(order.completedAt).toLocaleString('tr-TR')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-end gap-3 border-t border-gray-100">
                                    {order.status === 'PENDING' && (
                                        <>
                                            <button onClick={() => onStatusChange(order.id, 'CANCELLED')} className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">İptal Et</button>
                                            <button onClick={() => onStatusChange(order.id, 'PREPARING')} className="btn bg-blue-600 hover:bg-blue-700 text-white shadow-md">Siparişi Hazırla</button>
                                        </>
                                    )}
                                    {order.status === 'PREPARING' && (
                                        <>
                                            <button onClick={() => onStatusChange(order.id, 'CANCELLED')} className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">İptal Et</button>
                                            <button onClick={() => onStatusChange(order.id, 'READY')} className="btn bg-amber-500 hover:bg-amber-600 text-white shadow-md">Hazır Olarak İşaretle</button>
                                        </>
                                    )}
                                    {order.status === 'READY' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Siparişi iptal etmek istediğinize emin misiniz?')) {
                                                        onStatusChange(order.id, 'CANCELLED');
                                                    }
                                                }}
                                                className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                            >
                                                İptal Et
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Bu siparişi TAMAMLANDI olarak işaretlemek istediğinize emin misiniz? Stoklar güncellenecek.')) {
                                                        onStatusChange(order.id, 'COMPLETED');
                                                    }
                                                }}
                                                className="btn bg-green-600 hover:bg-green-700 text-white shadow-md w-full md:w-auto"
                                            >
                                                Teslim Et ve Tamamla
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'COMPLETED' && (
                                        <span className="text-green-600 font-bold flex items-center gap-2">
                                            <CheckCircle size={20} /> Sipariş Tamamlandı
                                        </span>
                                    )}
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
