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
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ];

    // Dynamic routes (Products)
    try {
        const res = await fetch(`${apiUrl}/api/products`, { next: { revalidate: 3600 } });
        if (res.ok) {
            const products = await res.json();
            const productRoutes = products.map((product: any) => ({
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
