import './globals.css'
import React from 'react'
import { AuthProvider } from '../components/AuthProvider'
import { SocketProvider } from '../components/SocketProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <SocketProvider>
                        <div className="app-shell">
                            <aside className="sidebar">SwanyThree</aside>
                            <main className="main">{children}</main>
                        </div>
                    </SocketProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
