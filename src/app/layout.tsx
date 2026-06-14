import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: {
        template: '%s | lab 8191',
        default: 'lab 8191',
    },
    description: 'Lab 8191 is a collection of some interactively cliché UI components you have probably already seen.',
    icons: {
        icon: '/favicon.ico',
    },
}

export default function RootLayout({
    children,
}: {
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
                <link
                    href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=La+Belle+Aurore&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Geist:wght@300;400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>

                {children}
            </body>
        </html>
    )
}