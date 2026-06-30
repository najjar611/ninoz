'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getAccountLang, setAccountLang, type AccountLang } from './accountLang'

type Ctx = { lang: AccountLang; isAR: boolean; toggle: () => void }
const AccountLangCtx = createContext<Ctx>({ lang: 'en', isAR: false, toggle: () => {} })

export function AccountLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<AccountLang>('ar')

  useEffect(() => { setLang(getAccountLang()) }, [])
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  function toggle() {
    const next = lang === 'ar' ? 'en' : 'ar'
    setLang(next)
    setAccountLang(next)
  }

  return <AccountLangCtx.Provider value={{ lang, isAR: lang === 'ar', toggle }}>{children}</AccountLangCtx.Provider>
}

export function useAccountLang() {
  return useContext(AccountLangCtx)
}
