import Skeleton from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            {/* Image Placeholder */}
            <Skeleton className="w-full aspect-square bg-gray-200" />

            <div className="p-4 flex flex-col flex-1 gap-3">
                {/* Category */}
                <Skeleton className="h-3 w-1/3 bg-gray-100" />

                {/* Title */}
                <Skeleton className="h-5 w-3/4 bg-gray-200" />
                <Skeleton className="h-5 w-1/2 bg-gray-200" />

                <div className="mt-auto flex items-end justify-between pt-2">
                    {/* Price */}
                    <Skeleton className="h-7 w-20 bg-gray-200" />

                    {/* Button */}
                    <Skeleton className="h-10 w-10 rounded-lg bg-gray-200" />
                </div>
            </div>
        </div>
    );
}
