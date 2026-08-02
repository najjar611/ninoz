import { createClient } from '@/lib/supabase/server'
import { AccountLangProvider } from '@/lib/AccountLangContext'
import AccountLangToggle from './AccountLangToggle'
import AccountWidthWrap from './AccountWidthWrap'
import AccountBottomBar from './AccountBottomBar'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [{ data: logoRow }, { data: logoTableRow }, { data: whatsRow }] = await Promise.all([
    supabase.from('site_content').select('value').eq('key', 'logo_url').maybeSingle(),
    supabase.from('logo').select('url').limit(1).maybeSingle(),
    supabase.from('site_content').select('value').eq('key', 'contact_whatsapp').maybeSingle(),
  ])
  const logoUrl = (logoRow as any)?.value || (logoTableRow as any)?.url || null
  const whats = ((whatsRow as any)?.value || '966591976737').replace(/\D/g, '')
  // Dark-luxe palette to match the home page (Variant D).
  const fontStack = `'Baloo Bhaijaan 2', 'Tajawal', sans-serif`

  return (
    <AccountLangProvider>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@400;500;600;700;800&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" />
      <div style={{ minHeight: '100vh', fontFamily: fontStack, background: 'radial-gradient(120% 90% at 50% -10%, #122A22, #0C1A15)', paddingBottom: 86 }}>
        {/* Glass header with a big logo */}
        <div style={{ position: 'sticky', top: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'linear-gradient(180deg, #0C1A15 55%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {logoUrl
              ? <img src={logoUrl} alt="Ninoz" style={{ height: 76, maxHeight: 88, maxWidth: 240, objectFit: 'contain', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.5))' }} />
              : <span style={{ fontSize: 30, fontWeight: 800, color: '#FF7A33' }}>Ninoz</span>}
          </a>
          <AccountLangToggle />
        </div>

        {/* Content sheet — light card on the dark frame so pages stay readable */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 16px 8px' }}>
          <AccountWidthWrap>
            <div className="nz-page" style={{ background: '#FBF8F2', borderRadius: 22, border: '1px solid rgba(255,255,255,0.08)', padding: '26px 24px', boxShadow: '0 22px 54px rgba(0,0,0,0.34)', position: 'relative' }}>
              {children}
            </div>
          </AccountWidthWrap>
        </div>

        <AccountBottomBar whats={whats} />
      </div>
    </AccountLangProvider>
  )
}
