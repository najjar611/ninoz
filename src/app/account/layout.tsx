import { createClient } from '@/lib/supabase/server'
import { AccountLangProvider } from '@/lib/AccountLangContext'
import AccountLangToggle from './AccountLangToggle'
import AccountWidthWrap from './AccountWidthWrap'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const [{ data: logoRow }, { data: logoTableRow }, { data: bgRow }, { data: fontRow }, { data: deepBlueRow }] = await Promise.all([
    supabase.from('site_content').select('value').eq('key', 'logo_url').single(),
    supabase.from('logo').select('url').limit(1).single(),
    supabase.from('site_content').select('value').eq('key', 'account_bg_color').single(),
    supabase.from('site_content').select('value').eq('key', 'site_font').single(),
    supabase.from('site_content').select('value').eq('key', 'theme_color_deep_blue').single(),
  ])
  const logoUrl = logoRow?.value || logoTableRow?.url || null
  const bgColor = bgRow?.value || '#F7F4F0'
  const siteFont = fontRow?.value || 'Nunito'
  const deepBlue = deepBlueRow?.value || '#0A429B'
  const fontStack = `'${siteFont}', 'Tajawal', sans-serif`
  const navBackground = deepBlue

  return (
    <AccountLangProvider>
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${siteFont.replace(/ /g, '+')}:wght@400;500;600;700;800;900&display=swap`} />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" />
      <div style={{ minHeight: '100vh', background: bgColor, fontFamily: fontStack }}>
        <div style={{ background: navBackground, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {logoUrl
              ? <img src={logoUrl} alt="Ninoz" style={{ height: 60, maxWidth: 220, objectFit: 'contain' }} />
              : <span style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Ninoz</span>}
          </a>
          <AccountLangToggle />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 16px' }}>
          <AccountWidthWrap>
            <div style={{ background: 'white', borderRadius: 18, border: '1px solid #EDEBE8', padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', position: 'relative' }}>
              {children}
            </div>
          </AccountWidthWrap>
        </div>
      </div>
    </AccountLangProvider>
  )
}
