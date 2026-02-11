import React from 'react'

type Props = {
    hostId: string
    children: React.ReactNode
}

// Usage: Render host tile as the first child; other tiles follow.
export default function GoldBoardGrid({ hostId, children }: Props) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
                {/* Host tile should be rendered by parent as first child and wrapped with HostTile component */}
            </div>
            <div style={{ overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    )
}
