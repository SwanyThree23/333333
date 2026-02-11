import React from 'react'

type Props = {
  children?: React.ReactNode
  pinned?: boolean
}

export default function HostTile({ children, pinned = true }: Props) {
  const style: React.CSSProperties = {
    border: '4px solid #D4AF37',
    boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#000',
  }
  const wrapper: React.CSSProperties = pinned
    ? { position: 'sticky' as const, top: 8, zIndex: 60 }
    : {}

  return (
    <div style={wrapper}>
      <div style={style}>{children}</div>
    </div>
  )
}
