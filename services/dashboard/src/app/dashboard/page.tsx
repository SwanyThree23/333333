'use client'

import React, { useEffect, useState } from 'react'
import { useSocket } from '../../components/SocketProvider'

export default function DashboardPage() {
    const { socket } = useSocket()
    const [stats, setStats] = useState<any>(null)
    const [stream, setStream] = useState<any>(null)

    useEffect(() => {
        if (!socket) return
        socket.on('stats:update', (s: any) => setStats(s))
        socket.on('stream:started', (s: any) => setStream(s))
        return () => {
            socket.off('stats:update')
            socket.off('stream:started')
        }
    }, [socket])

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <section className="card">
                    <h2>Live Stats</h2>
                    <pre>{JSON.stringify(stats, null, 2)}</pre>
                </section>
                <section className="card">
                    <h2>Current Stream</h2>
                    <pre>{JSON.stringify(stream, null, 2)}</pre>
                </section>
            </div>
        </div>
    )
}
