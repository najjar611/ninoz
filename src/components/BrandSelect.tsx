'use client'

import { useEffect, useRef, useState } from 'react'

type Option = { value: string; label: string }
type Props = {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder: string
  isAR: boolean
  disabled?: boolean
}

export default function BrandSelect({ value, onChange, options, placeholder, isAR, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const selected = options.find(o => o.value === value)

  const field: React.CSSProperties = {
    width: '100%', padding: '13px 15px', borderRadius: 12, border: `1.5px solid ${open ? '#C84B0F' : '#EAE3D9'}`,
    fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', background: disabled ? '#F7F4F0' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer', textAlign: isAR ? 'right' : 'left', color: selected ? '#1C1C1A' : '#B0A098',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12,
    boxShadow: open ? '0 0 0 3px rgba(200,75,15,0.12)' : 'none', transition: 'border-color .15s, box-shadow .15s',
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" disabled={disabled} style={field} onClick={() => !disabled && setOpen(o => !o)}>
        <span>{selected ? selected.label : placeholder}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C84B0F" strokeWidth="2.2" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s', flexShrink: 0 }}><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div dir={isAR ? 'rtl' : 'ltr'} style={{
          position: 'absolute', top: 'calc(100% - 6px)', left: 0, right: 0, zIndex: 60, background: '#fff',
          borderRadius: 12, border: '1.5px solid #EAE3D9', boxShadow: '0 16px 40px rgba(0,0,0,0.16)', overflow: 'hidden',
          maxHeight: 240, overflowY: 'auto', animation: 'ninozPop .16s ease',
        }}>
          <style>{`@keyframes ninozPop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {options.length === 0 && <div style={{ padding: '13px 15px', fontSize: 13.5, color: '#B0A098' }}>{placeholder}</div>}
          {options.map(o => {
            const on = o.value === value
            return (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }} style={{
                width: '100%', textAlign: isAR ? 'right' : 'left', padding: '12px 15px', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14.5, fontWeight: on ? 800 : 600, background: on ? '#FDF0E8' : '#fff',
                color: on ? '#C84B0F' : '#3A342E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}>
                <span>{o.label}</span>
                {on && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C84B0F" strokeWidth="2.6"><path d="M20 6 9 17l-5-5" /></svg>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
