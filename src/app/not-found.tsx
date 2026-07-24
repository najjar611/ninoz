import Link from 'next/link'

// Shown automatically for any URL that doesn't match a real page, so visitors
// get a friendly branded page with a way back instead of a raw 404.
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '40px 24px', background: '#F7F4F0', fontFamily: 'Nunito, sans-serif', textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#C84B0F', letterSpacing: '-0.02em' }}>Ninoz</div>
      <div style={{ fontSize: 64, fontWeight: 900, color: '#EDE0D5', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1C1C1A', margin: 0 }}>Page not found</h1>
      <p style={{ fontSize: 14, color: '#7A7068', maxWidth: 360, margin: 0 }}>
        The page you're looking for doesn't exist or may have moved.
        <br />هذه الصفحة غير موجودة.
      </p>
      <Link href="/" style={{ marginTop: 6, padding: '13px 26px', background: '#C84B0F', color: 'white', borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: 'none' }}>
        Back to Home · العودة للرئيسية
      </Link>
    </div>
  )
}
