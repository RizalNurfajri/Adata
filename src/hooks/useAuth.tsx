import { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface Profile {
  id: string
  role: 'admin' | 'user'
  created_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/* ✅ Tambahan: deklarasi global penampung token hCaptcha */
declare global {
  interface Window {
    __HCAPTCHA_TOKEN__?: string
  }
}

/* ✅ Tambahan: helper untuk diset dari komponen (Login/Register) */
export function setCaptchaTokenFromHCaptcha(token: string | null) {
  if (token) {
    window.__HCAPTCHA_TOKEN__ = token
  } else {
    delete window.__HCAPTCHA_TOKEN__
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cek jika URL mengandung type=signup (hasil klik link konfirmasi signup Supabase)
    const hash = window.location.hash
    if (hash.includes('type=signup')) {
      supabase.auth.signOut().then(() => {
        window.location.href = '/login'
      })
      return // stop eksekusi listener supaya tidak auto-login
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            
            setProfile(profileData as Profile)
            setLoading(false)
          }, 0)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (!session) {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    /* ✅ Ambil token kalau ada (tidak mengubah signature fungsi) */
    const captchaToken = window.__HCAPTCHA_TOKEN__

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      /* ✅ sisipkan options.captchaToken hanya kalau ada */
      ...(captchaToken ? { options: { captchaToken } } : {}),
    })

    /* ✅ setelah dipakai, kosongkan token supaya fresh di attempt berikutnya */
    delete window.__HCAPTCHA_TOKEN__

    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/login`
    /* ✅ Ambil token kalau ada */
    const captchaToken = window.__HCAPTCHA_TOKEN__

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        /* ✅ kirim captchaToken jika tersedia */
        ...(captchaToken ? { captchaToken } : {}),
      }
    })

    /* ✅ bersihkan token */
    delete window.__HCAPTCHA_TOKEN__

    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
