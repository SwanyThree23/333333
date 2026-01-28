'use client'

import React, { createContext, useContext } from 'react'

const AuthContext = createContext({ user: null })

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <AuthContext.Provider value={{ user: null }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
