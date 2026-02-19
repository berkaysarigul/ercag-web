import Skeleton from "@/components/ui/Skeleton";

export function ProfileSkeleton() {
    return (
        <div className="container py-12">
            <Skeleton className="h-10 w-48 mb-8" /> {/* Title: Hesabım */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Skeleton */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 bg-gray-50 border-b border-gray-200 text-center flex flex-col items-center">
                            <Skeleton className="w-20 h-20 rounded-full mb-3" />
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <div className="p-2 space-y-2">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="md:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
                        <Skeleton className="h-8 w-48 mb-6" /> {/* Section Title */}

                        <div className="space-y-4 max-w-lg">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>

                            <Skeleton className="h-12 w-40 mt-4" /> {/* Button */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
