import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/hooks/use-toast'
import { Loader2, BookOpen, Eye, EyeOff } from 'lucide-react' // ✅ Tambah import
import HCaptcha from '@hcaptcha/react-hcaptcha'               // ✅ hCaptcha

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // ✅ Tambah state
  const { signIn, user } = useAuth()
  const navigate = useNavigate()

  // ✅ state/token & ref hCaptcha
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HCaptcha>(null)

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ✅ kalau user belum centang captcha, execute & tunggu onVerify
      if (!captchaToken) {
        await captchaRef.current?.execute()
        setLoading(false)
        return
      }

      // ✅ kirim token ke auth (diasumsikan signIn meneruskan options ke Supabase)
      const { error } = await signIn(email, password, { captchaToken })

      if (error) {
        toast({
          title: 'Error',
          description:
            error.message === 'Invalid login credentials'
              ? 'Email atau password salah'
              : error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Berhasil',
          description: 'Login berhasil',
        })
        navigate('/')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat login',
        variant: 'destructive',
      })
    } finally {
      // ✅ reset token & captcha biar bersih
      setCaptchaToken(null)
      captchaRef.current?.resetCaptcha()
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Masuk ke Akun Anda</CardTitle>
          <p className="text-muted-foreground">
            Masukkan email dan password untuk mengakses materi kuliah
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-primary"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* ✅ hCaptcha ditampilkan (size="normal") */}
            <HCaptcha
              ref={captchaRef}
              sitekey={import.meta.env.VITE_HCAPTCHA_SITEKEY!}
              size="normal"               // ← dari "invisible" jadi "normal"
              onVerify={(token) => setCaptchaToken(token)}
            />

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
