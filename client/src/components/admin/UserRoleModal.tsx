'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface UserRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentRole: string;
    onSave: (newRole: string) => Promise<void>;
    userName: string;
}

export default function UserRoleModal({ isOpen, onClose, currentRole, onSave, userName }: UserRoleModalProps) {
    const [selectedRole, setSelectedRole] = useState(currentRole);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(selectedRole);
            onClose();
        } catch (error) {
            console.error('Failed to save role:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        Rol Düzenle
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Kullanıcı</p>
                        <p className="text-lg font-medium text-gray-900 dark:text-white">{userName}</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Yeni Rol Seçin</label>
                        <div className="grid grid-cols-1 gap-2">
                            {['CUSTOMER', 'STAFF', 'SUPER_ADMIN'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setSelectedRole(role)}
                                    className={`
                                        p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between
                                        ${selectedRole === role
                                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'}
                                    `}
                                >
                                    <span className="font-medium">
                                        {role === 'CUSTOMER' && 'Müşteri'}
                                        {role === 'STAFF' && 'Personel'}
                                        {role === 'SUPER_ADMIN' && 'Süper Admin'}
                                    </span>
                                    {selectedRole === role && (
                                        <div className="w-3 h-3 rounded-full bg-violet-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || selectedRole === currentRole}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium shadow-lg shadow-violet-200 dark:shadow-violet-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    Kaydet
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
