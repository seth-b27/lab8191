import type { Metadata } from 'next'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'

const siteTitle = 'Lab 8191';
const sitedescription = 'Lab 8191 is an archive of interactive UI components you have probably seen before.';

export const metadata: Metadata = {
    title: {
        template: `%s - ${siteTitle}`,
        default: siteTitle,
    },
    description: sitedescription,
    icons: '/favicon-2.svg',
    openGraph: {
        title: siteTitle,
        description: sitedescription,
        url: 'https://lab8191.vercel.app/',
        images: [{
            url: 'https://lab8191.vercel.app/openGraph.jpg',
            width: 1200,
            height: 630,
            alt: 'Lab 8191',
        }],
        type: 'website'
    },
    twitter: {
        card: 'summary_large_image',
        title: siteTitle,
        images: ['https://lab8191.vercel.app/openGraph.jpg'],
    },
}

export default function RootLayout({ children }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
            </head>

            <body>
                {children}
                <Analytics />
            </body>
        </html>
    )
}