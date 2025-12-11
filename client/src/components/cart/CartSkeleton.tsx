import { Skeleton } from "@/components/ui/Skeleton";

export function CartSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-24 w-24 rounded-md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                        <div className="flex justify-between items-center mt-4">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                </div>
            ))}

            <div className="mt-8 space-y-4 border-t pt-4">
                <div className="flex justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-12 w-full rounded-lg" />
            </div>
        </div>
    );
}
