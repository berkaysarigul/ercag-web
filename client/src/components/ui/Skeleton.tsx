import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
}

export default function Skeleton({
    className = "",
    variant = "rectangular",
    width,
    height
}: SkeletonProps) {

    const baseClasses = "animate-pulse bg-gray-200";

    const variantClasses = {
        text: "rounded h-4 w-full",
        rectangular: "rounded-md",
        circular: "rounded-full"
    };

    const style: React.CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
}
