'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
    onImagesSelected: (files: File[]) => void;
    maxFiles?: number;
}

export default function ImageUpload({ onImagesSelected, maxFiles = 10 }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    }, [isDragging]);

    const validateAndPassFiles = (files: FileList | File[]) => {
        const validFiles: File[] = [];
        const invalidFiles: string[] = [];

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        });

        if (invalidFiles.length > 0) {
            toast.error(`Sadece resim dosyaları yüklenebilir: ${invalidFiles.length} dosya reddedildi.`);
        }

        if (validFiles.length > 0) {
            if (maxFiles && validFiles.length > maxFiles) {
                toast.error(`En fazla ${maxFiles} dosya yükleyebilirsiniz.`);
                onImagesSelected(validFiles.slice(0, maxFiles));
            } else {
                onImagesSelected(validFiles);
            }
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const { files } = e.dataTransfer;
        if (files && files.length > 0) {
            validateAndPassFiles(files);
        }
    }, [onImagesSelected, maxFiles]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndPassFiles(e.target.files);
        }
        // Reset value to allow selecting the same file again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div
            onClick={handleClick}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group
                ${isDragging
                    ? 'border-primary bg-primary/5 scale-[1.02] ring-4 ring-primary/10'
                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                }
            `}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
                <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200
                    ${isDragging ? 'border-primary bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}
                `}>
                    <Upload size={32} />
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">
                        {isDragging ? 'Dosyaları Bırakın' : 'Resimleri Sürükleyip Bırakın'}
                    </p>
                    <p className="text-xs text-gray-500">
                        veya dosya seçmek için tıklayın
                    </p>
                </div>

                <div className="flex gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><ImageIcon size={12} /> PNG, JPG, WEBP</span>
                    <span>•</span>
                    <span>Maksimum 5MB</span>
                </div>
            </div>
        </div>
    );
}
