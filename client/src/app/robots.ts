import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://ercagkirtasiye.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/profile/', '/cart/', '/auth/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
