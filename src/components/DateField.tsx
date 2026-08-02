'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string                    // 'YYYY-MM-DD' or ''
  onChange: (iso: string) => void
  isAR: boolean
  max?: string                     // 'YYYY-MM-DD'
  placeholder?: string
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DOW_AR = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت']

function pad(n: number) { return String(n).padStart(2, '0') }
function iso(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}` }

export default function DateField({ value, onChange, isAR, max, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const today = new Date()
  const sel = value ? new Date(value + 'T00:00:00') : null
  const [vy, setVy] = useState(sel ? sel.getFullYear() : today.getFullYear() - 1)
  const [vm, setVm] = useState(sel ? sel.getMonth() : today.getMonth())
  const [yearGrid, setYearGrid] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    if (sel) { setVy(sel.getFullYear()); setVm(sel.getMonth()) }
    setYearGrid(false)
  }, [open])

  const maxDate = max ? new Date(max + 'T23:59:59') : null
  const months = isAR ? MONTHS_AR : MONTHS_EN
  const dow = isAR ? DOW_AR : DOW_EN

  const firstDow = new Date(vy, vm, 1).getDay()
  const daysInMonth = new Date(vy, vm + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // Always fill to 6 rows (42 cells) so the calendar height never changes
  // between months (e.g. February vs a 31-day month).
  while (cells.length < 42) cells.push(null)

  const label = sel
    ? `${sel.getDate()} ${months[sel.getMonth()]} ${sel.getFullYear()}`
    : (placeholder || (isAR ? 'اختر التاريخ' : 'Select date'))

  const prevMonth = () => { if (vm === 0) { setVm(11); setVy(y => y - 1) } else setVm(m => m - 1) }
  const nextMonth = () => { if (vm === 11) { setVm(0); setVy(y => y + 1) } else setVm(m => m + 1) }

  const years: number[] = []
  for (let y = today.getFullYear(); y >= 1980; y--) years.push(y)

  const field: React.CSSProperties = {
    width: '100%', padding: '13px 15px', borderRadius: 12, border: '1.5px solid #EAE3D9', fontSize: 15,
    fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff', cursor: 'pointer', textAlign: isAR ? 'right' : 'left',
    color: sel ? '#1C1C1A' : '#B0A098', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  }

  const isDisabled = (d: number) => maxDate ? new Date(vy, vm, d) > maxDate : false

  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <button type="button" style={field} onClick={() => setOpen(true)}>
        <span>{label}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C84B0F" strokeWidth="1.9"><rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
      </button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(12,26,21,0.4)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} dir={isAR ? 'rtl' : 'ltr'} style={{ background: '#FBF8F2', width: '100%', maxWidth: 420, borderRadius: '22px 22px 0 0', padding: '18px 18px 26px', boxShadow: '0 -18px 50px rgba(0,0,0,0.3)', animation: 'ninozSheet .26s cubic-bezier(.16,1,.3,1)' }}>
            <style>{`@keyframes ninozSheet{from{transform:translateY(30px);opacity:.4}to{transform:translateY(0);opacity:1}}`}</style>
            <div style={{ width: 40, height: 4, borderRadius: 4, background: '#E2D8CB', margin: '0 auto 16px' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button type="button" onClick={prevMonth} style={navBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={isAR ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} /></svg></button>
              <button type="button" onClick={() => setYearGrid(g => !g)} style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 16, fontWeight: 900, color: '#1C1C1A', cursor: 'pointer' }}>
                {months[vm]} {vy}
              </button>
              <button type="button" onClick={nextMonth} style={navBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={isAR ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} /></svg></button>
            </div>

            {yearGrid ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, maxHeight: 260, overflowY: 'auto', paddingBottom: 4 }}>
                {years.map(y => (
                  <button key={y} type="button" onClick={() => { setVy(y); setYearGrid(false) }} style={{
                    padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 800,
                    background: y === vy ? '#C84B0F' : '#F2EDE6', color: y === vy ? '#fff' : '#5A5048',
                  }}>{y}</button>
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                  {dow.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#B0A098', padding: '4px 0' }}>{d}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                  {cells.map((d, i) => {
                    if (d === null) return <div key={i} style={{ aspectRatio: '1 / 1' }} />
                    const isSel = sel && sel.getFullYear() === vy && sel.getMonth() === vm && sel.getDate() === d
                    const isToday = today.getFullYear() === vy && today.getMonth() === vm && today.getDate() === d
                    const disabled = isDisabled(d)
                    return (
                      <button key={i} type="button" disabled={disabled} onClick={() => { onChange(iso(vy, vm, d)); setOpen(false) }} style={{
                        aspectRatio: '1 / 1', borderRadius: 10, border: isToday && !isSel ? '1.5px solid #F0C9A8' : 'none',
                        background: isSel ? '#C84B0F' : 'transparent', color: disabled ? '#D8CFC4' : isSel ? '#fff' : '#1C1C1A',
                        fontFamily: 'inherit', fontSize: 14, fontWeight: isSel ? 900 : 600, cursor: disabled ? 'not-allowed' : 'pointer',
                      }}>{d}</button>
                    )
                  })}
                </div>
              </>
            )}

            <button type="button" onClick={() => setOpen(false)} style={{ width: '100%', marginTop: 16, padding: '12px', background: '#F2EDE6', color: '#5A5048', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              {isAR ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10, border: '1.5px solid #EAE3D9', background: '#fff', color: '#C84B0F',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
}
