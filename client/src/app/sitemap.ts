import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ercagkirtasiye.com';

    // Static routes
    const routes = [
        '',
        '/about',
        '/contact',
        '/privacy',
        '/terms',
        '/products',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
    }));

    // Fetch products for dynamic routes
    // Note: In a real scenario we would fetch all products here
    // const products = await getProducts();
    // const productRoutes = products.map(...)

    // For now return static routes
    return [...routes];
}
