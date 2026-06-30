const KEY = 'ninoz_account_lang'

export type AccountLang = 'en' | 'ar'

export function getAccountLang(): AccountLang {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem(KEY) as AccountLang) || 'ar'
}

export function setAccountLang(lang: AccountLang) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, lang)
}
