'use client'

import { useEffect, useRef, useState } from 'react'

type Sugg = { main: string; secondary: string; prediction: any }
type Props = {
  isAR: boolean
  onSelect: (r: { lat: number; lng: number; address: string }) => void
  rightSlot?: React.ReactNode          // e.g. the "use my location" icon button
}

// Custom Places autocomplete: a normal input + our own compact dropdown
// (max 3 results, subtle fade) instead of Google's full-screen widget.
export default function PlaceSearch({ isAR, onSelect, rightSlot }: Props) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Sugg[]>([])
  const [open, setOpen] = useState(false)
  const tokenRef = useRef<any>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const tRef = useRef<any>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  async function fetchSuggestions(input: string) {
    const g = (window as any).google?.maps
    if (!g?.importLibrary || !input.trim()) { setItems([]); return }
    try {
      const { AutocompleteSuggestion, AutocompleteSessionToken } = await g.importLibrary('places')
      if (!tokenRef.current) tokenRef.current = new AutocompleteSessionToken()
      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input, includedRegionCodes: ['sa'], language: isAR ? 'ar' : 'en', region: 'SA', sessionToken: tokenRef.current,
      })
      const out: Sugg[] = (suggestions || []).slice(0, 3).map((s: any) => {
        const p = s.placePrediction
        return {
          main: p?.structuredFormat?.mainText?.text || p?.text?.toString() || '',
          secondary: p?.structuredFormat?.secondaryText?.text || '',
          prediction: p,
        }
      }).filter((s: Sugg) => s.main)
      setItems(out); setOpen(out.length > 0)
    } catch { setItems([]); setOpen(false) }
  }

  function onChange(v: string) {
    setQ(v)
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = setTimeout(() => fetchSuggestions(v), 250)
  }

  async function pick(s: Sugg) {
    try {
      const place = s.prediction.toPlace()
      await place.fetchFields({ fields: ['location', 'formattedAddress'] })
      const loc = place.location
      if (loc) onSelect({ lat: loc.lat(), lng: loc.lng(), address: place.formattedAddress || s.main })
      setQ(place.formattedAddress || s.main)
    } catch {}
    tokenRef.current = null
    setItems([]); setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={q}
          onChange={e => onChange(e.target.value)}
          onFocus={() => { if (items.length) setOpen(true) }}
          placeholder={isAR ? 'ابحث عن موقعك…' : 'Search for your location…'}
          style={{
            width: '100%', padding: isAR ? '13px 44px 13px 15px' : '13px 15px 13px 44px', borderRadius: 12,
            border: '1.5px solid #EAE3D9', fontSize: 14.5, fontFamily: 'inherit', boxSizing: 'border-box',
            color: '#1C1C1A', background: '#fff', outline: 'none',
          }}
        />
        {/* leading search icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0A098" strokeWidth="2"
          style={{ position: 'absolute', top: 0, bottom: 0, margin: 'auto', [isAR ? 'right' : 'left']: 14 } as any}>
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
        </svg>
        {rightSlot && (
          <div style={{ position: 'absolute', top: 0, bottom: 0, margin: 'auto', height: 38, [isAR ? 'left' : 'right']: 6 } as any}>{rightSlot}</div>
        )}
      </div>

      {open && items.length > 0 && (
        <div dir={isAR ? 'rtl' : 'ltr'} style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 9999, background: '#fff',
          borderRadius: 12, border: '1.5px solid #EAE3D9', boxShadow: '0 16px 40px rgba(0,0,0,0.16)', overflow: 'hidden',
          animation: 'ninozSearchPop .16s ease',
        }}>
          <style>{`@keyframes ninozSearchPop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
          {items.map((s, i) => (
            <button key={i} type="button" onClick={() => pick(s)} style={{
              width: '100%', textAlign: isAR ? 'right' : 'left', padding: '11px 14px', border: 'none',
              borderTop: i ? '1px solid #F3EEE7' : 'none', background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C84B0F" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#1C1C1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.main}</span>
                {s.secondary && <span style={{ display: 'block', fontSize: 12, color: '#8A7F74', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.secondary}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
