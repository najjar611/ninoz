'use client'

// ══════════════════════════════════════════════════════════
// Footer.tsx — v5
// Big orange header section with Ninoz wordmark + toy SVG icons background
// 4 columns below: About Ninoz | Useful Links | Get in Touch | Subscribe Now
// Matches the design PDF exactly
// ══════════════════════════════════════════════════════════

import { useState } from 'react'
import Link from 'next/link'

type FooterLink = {
  id: string
  column: string
  label: string
  url: string
}

type Props = {
  footerLinks?: FooterLink[]
  whatsapp?: string
  email?: string
  instagram?: string
}

export default function Footer({
  footerLinks = [],
  whatsapp = '#',
  email = 'hello@ninoz.sa',
  instagram = '#',
}: Props) {
  const [subscribeEmail, setSubscribeEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!subscribeEmail.includes('@')) return
    // Just mark subscribed for now — can wire to Supabase later
    setSubscribed(true)
  }

  const usefulLinks = footerLinks.filter(l => l.column === 'Useful Links')
  const companyLinks = footerLinks.filter(l => l.column === 'Company')

  return (
    <>
      <style>{`
        .footer-root {
          font-family: 'Nunito Sans', sans-serif;
        }

        /* ── BIG ORANGE HEADER ── */
        .footer-hero {
          background: #C84B0F;
          padding: 60px 40px 56px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        /* Toy icons scattered in background */
        .footer-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .toy-icon {
          position: absolute;
          font-size: 52px;
          opacity: 0.15;
          user-select: none;
        }

        .footer-logo-text {
          font-family: 'Nunito', sans-serif;
          font-size: 96px;
          font-weight: 900;
          color: #FFD580;
          line-height: 1;
          position: relative;
          z-index: 1;
          letter-spacing: -2px;
        }

        .footer-tagline {
          font-size: 15px;
          color: rgba(255,255,255,0.8);
          margin-top: 12px;
          position: relative;
          z-index: 1;
          max-width: 440px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.5;
        }

        /* ── 4 COLUMNS SECTION ── */
        .footer-columns {
          background: #FAF5EE;
          padding: 56px 80px 40px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
          border-top: 1px solid #EDE8E0;
        }

        @media (max-width: 900px) {
          .footer-columns {
            grid-template-columns: repeat(2, 1fr);
            padding: 40px 32px;
          }
        }
        @media (max-width: 560px) {
          .footer-columns { grid-template-columns: 1fr; }
          .footer-logo-text { font-size: 64px; }
        }

        .footer-col-title {
          font-family: 'Nunito', sans-serif;
          font-size: 16px;
          font-weight: 900;
          color: #C84B0F;
          margin-bottom: 16px;
          display: block;
        }

        /* About column */
        .footer-about-text {
          font-size: 13px;
          color: #7A7068;
          line-height: 1.75;
        }
        .footer-about-text strong { color: #2C1A0E; display: block; margin-bottom: 4px; }

        .footer-about-bullets {
          list-style: none;
          padding: 0;
          margin: 12px 0 16px;
        }
        .footer-about-bullets li {
          font-size: 13px;
          color: #7A7068;
          padding: 4px 0;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.4;
        }
        .footer-about-bullets li::before {
          content: '▪';
          color: #C84B0F;
          font-size: 10px;
          margin-top: 3px;
          flex-shrink: 0;
        }

        /* Useful Links column */
        .footer-links-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-link {
          font-size: 13px;
          color: #7A7068;
          text-decoration: none;
          transition: color 0.2s;
          line-height: 1.4;
        }
        .footer-link:hover { color: #C84B0F; }

        /* Get in Touch column */
        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
        }
        .contact-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #FDF0E8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .contact-info { font-size: 13px; color: #7A7068; line-height: 1.5; }
        .contact-info a { color: #C84B0F; text-decoration: none; font-weight: 600; }
        .contact-info a:hover { text-decoration: underline; }

        /* Subscribe Now column */
        .subscribe-tagline {
          font-size: 13px;
          color: #7A7068;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .subscribe-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .subscribe-input {
          width: 100%;
          padding: 11px 14px;
          border: 2px solid #EDE8E0;
          border-radius: 10px;
          font-size: 13px;
          font-family: 'Nunito Sans', sans-serif;
          color: #2C1A0E;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .subscribe-input:focus { border-color: #C84B0F; }
        .subscribe-btn {
          width: 100%;
          padding: 12px;
          background: #C84B0F;
          color: white;
          border: none;
          border-radius: 10px;
          font-family: 'Nunito', sans-serif;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.2s;
        }
        .subscribe-btn:hover { background: #A33A0A; }

        /* Bottom bar */
        .footer-bottom {
          background: #2C1A0E;
          padding: 18px 80px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-copy {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }
        .footer-bottom-links {
          display: flex;
          gap: 20px;
        }
        .footer-bottom-links a {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-bottom-links a:hover { color: rgba(255,255,255,0.8); }
      `}</style>

      <footer className="footer-root">
        {/* BIG ORANGE HEADER */}
        <div className="footer-hero">
          {/* Toy icons background */}
          <div className="footer-hero-bg">
            <span className="toy-icon" style={{ top: '8%', left: '4%' }}>🪆</span>
            <span className="toy-icon" style={{ top: '60%', left: '2%' }}>🚲</span>
            <span className="toy-icon" style={{ top: '20%', left: '14%' }}>🎪</span>
            <span className="toy-icon" style={{ top: '70%', left: '12%' }}>🎠</span>
            <span className="toy-icon" style={{ top: '10%', left: '25%' }}>🧸</span>
            <span className="toy-icon" style={{ top: '75%', left: '22%' }}>🎯</span>
            <span className="toy-icon" style={{ top: '5%', right: '24%' }}>🏀</span>
            <span className="toy-icon" style={{ top: '72%', right: '22%' }}>🪀</span>
            <span className="toy-icon" style={{ top: '15%', right: '13%' }}>🎨</span>
            <span className="toy-icon" style={{ top: '62%', right: '10%' }}>🪁</span>
            <span className="toy-icon" style={{ top: '8%', right: '4%' }}>🚂</span>
            <span className="toy-icon" style={{ top: '60%', right: '2%' }}>⚽</span>
          </div>

          <div className="footer-logo-text">Ninoz</div>
          <div className="footer-tagline">
            Fresh organic meals for babies 3 months – 3 years.<br />
            Delivered daily across Riyadh.
          </div>
        </div>

        {/* 4-COLUMN SECTION */}
        <div className="footer-columns">
          {/* Column 1: About Ninoz */}
          <div>
            <span className="footer-col-title">About Ninoz</span>
            <div className="footer-about-text">
              <strong>Hi. We're Ninoz.</strong>
              We cook fresh daily meals for babies and toddlers in Riyadh.
            </div>
            <ul className="footer-about-bullets">
              <li>Cooked the morning of delivery</li>
              <li>Designed for your baby's stage</li>
              <li>Approved by a pediatric nutritionist</li>
              <li>Free from salt, sugar and preservatives</li>
            </ul>
            <div className="footer-about-text">
              We started because we believed parents deserve one less thing to worry about.
              <br /><br />
              <em>You handle the love.<br />We handle the food.</em>
            </div>
          </div>

          {/* Column 2: Useful Links */}
          <div>
            <span className="footer-col-title">Useful Links</span>
            <div className="footer-links-list">
              <Link href="/blog" className="footer-link">Blog</Link>
              <Link href="/allergy-disclaimer" className="footer-link">Allergy Disclaimer</Link>
              <Link href="/delivery-policy" className="footer-link">Delivery, Refund & Cancellation</Link>
              <Link href="/terms" className="footer-link">Terms & Conditions</Link>
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>
              {usefulLinks.map(l => (
                <Link key={l.id} href={l.url} className="footer-link">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Column 3: Get in Touch */}
          <div>
            <span className="footer-col-title">Get in Touch</span>
            <div className="contact-item">
              <div className="contact-icon">☺️</div>
              <div className="contact-info">We'd love to hear from you</div>
            </div>
            {whatsapp && whatsapp !== '#' && (
              <div className="contact-item">
                <div className="contact-icon">📱</div>
                <div className="contact-info">
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp Us</a><br />
                  <span style={{ fontSize: 12 }}>Quick replies, Mon–Sat</span>
                </div>
              </div>
            )}
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <div className="contact-info">
                <a href={`mailto:${email}`}>{email}</a>
              </div>
            </div>
            {instagram && instagram !== '#' && (
              <div className="contact-item">
                <div className="contact-icon">📸</div>
                <div className="contact-info">
                  <a href={instagram} target="_blank" rel="noreferrer">Follow on Instagram</a>
                </div>
              </div>
            )}
          </div>

          {/* Column 4: Subscribe Now */}
          <div>
            <span className="footer-col-title">Subscribe Now</span>
            <div className="subscribe-tagline">
              Enter your email to start your baby's plan. No payment now — we'll contact you.
            </div>
            {subscribed ? (
              <div style={{
                background: '#E8F5EE',
                color: '#2D6A4F',
                padding: '14px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
              }}>
                ✓ You're on the list! We'll be in touch soon.
              </div>
            ) : (
              <form className="subscribe-form" onSubmit={handleSubscribe}>
                <input
                  className="subscribe-input"
                  type="email"
                  placeholder="your@email.com"
                  value={subscribeEmail}
                  onChange={e => setSubscribeEmail(e.target.value)}
                  required
                />
                <button type="submit" className="subscribe-btn">Start Your Plan →</button>
              </form>
            )}
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="footer-bottom">
          <div className="footer-copy">© 2025 Ninoz. All rights reserved.</div>
          <div className="footer-bottom-links">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/allergy-disclaimer">Allergens</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
