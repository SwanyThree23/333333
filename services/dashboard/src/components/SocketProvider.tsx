'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

const SocketContext = createContext<{ socket: Socket | null }>({ socket: null })

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        const url = (process.env.NEXT_PUBLIC_WS_URL as string) || 'ws://localhost:4000'
        const s = io(url, { transports: ['websocket'] })
        setSocket(s)
        return () => { s.disconnect() }
    }, [])

    return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>
}

export function useSocket() {
    return useContext(SocketContext)
}
