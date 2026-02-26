import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://ercagkirtasiye.com';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Static routes
    const routes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/distance-sales`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // Dynamic routes (Products)
    try {
        const res = await fetch(`${apiUrl}/api/products`, { next: { revalidate: 3600 } });
        if (res.ok) {
            const products: { id: number; updatedAt: string }[] = await res.json();
            const productRoutes = products.map((product) => ({
                url: `${baseUrl}/products/${product.id}`,
                lastModified: new Date(product.updatedAt || new Date()),
                changeFrequency: 'weekly' as const,
                priority: 0.6,
            }));
            return [...routes, ...productRoutes];
        }
    } catch (error) {
        console.error('Sitemap generation error:', error);
    }

    return routes;
}
