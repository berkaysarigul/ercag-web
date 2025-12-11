import { Skeleton } from "@/components/ui/Skeleton";

export function ProductDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb Skeleton */}
            <Skeleton className="h-6 w-64 mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="w-full aspect-square rounded-xl" />
                    <div className="grid grid-cols-4 gap-4">
                        <Skeleton className="aspect-square rounded-lg" />
                        <Skeleton className="aspect-square rounded-lg" />
                        <Skeleton className="aspect-square rounded-lg" />
                        <Skeleton className="aspect-square rounded-lg" />
                    </div>
                </div>

                {/* Product Info Skeleton */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" /> {/* Brand/Category */}
                        <Skeleton className="h-10 w-3/4" /> {/* Title */}
                    </div>

                    <Skeleton className="h-12 w-40" /> {/* Price */}

                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                        <Skeleton className="h-12 w-32" /> {/* Quantity */}
                        <Skeleton className="h-12 flex-1" /> {/* Add to Cart */}
                    </div>

                    <Skeleton className="h-12 w-full" /> {/* Wishlist/Share */}
                </div>
            </div>
        </div>
    );
}
