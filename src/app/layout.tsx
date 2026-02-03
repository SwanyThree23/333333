import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
    title: 'AI Avatar Livestream Studio',
    description: 'Production-grade AI-powered live streaming platform with real-time avatars, multi-platform broadcasting, and intelligent scene management.',
    keywords: 'livestream, AI avatar, streaming, broadcast, video production',
    openGraph: {
        title: 'AI Avatar Livestream Studio',
        description: 'Create stunning AI-powered livestreams with intelligent avatars and real-time interactions.',
        type: 'website',
    },
}

import { Providers } from '@/components/Providers'
import { Toaster } from 'sonner'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.variable} font-sans antialiased`}>
                <Providers>
                    <div className="animated-bg" />
                    {children}
                    <Toaster position="top-right" richColors theme="dark" />
                </Providers>
            </body>
        </html>
    )
}
