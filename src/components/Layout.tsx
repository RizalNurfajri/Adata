import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { 
  LogOut, 
  User, 
  Plus, 
  Menu, 
  X,
  Home,
  BarChart3,
  Settings,
  Mail,
  Loader2,
  BookOpen,
  Bookmark,
  Info,
  Send,
  ChevronDown,
  Bell,
  Github,
  ExternalLink,
  FileUp,
  ShieldCheck,
  PhoneCall,
  ArrowUp
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

// === Performance helpers for Sidebar ===
function useLockBodyScroll(lock: boolean) {
  useEffect(() => {
    if (!lock) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [lock])
}

function Sidebar({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  useLockBodyScroll(open)

  const [mounted, setMounted] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const t = setTimeout(() => setShowContent(true), 150)
      return () => clearTimeout(t)
    } else {
      setShowContent(false)
      const t = setTimeout(() => setMounted(false), 220)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[1000]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Overlay – opacity only */}
      <div
        className={`absolute inset-0 bg-black will-change-[opacity] transition-opacity duration-200 ${
          open ? 'opacity-50' : 'opacity-0'
        }`}
      />
      {/* Panel – transform only */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className="absolute right-0 top-0 h-full w-full sm:w-96 md:w-80 bg-card shadow-xl border-l border-border flex flex-col will-change-transform transition-transform duration-200"
        style={{ transform: open ? 'translate3d(0,0,0)' : 'translate3d(100%,0,0)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {showContent ? children : null}
      </div>
    </div>,
    document.body
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  // ====== Loading overlay state ======
  const [isAppLoading, setIsAppLoading] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false
      const onHome = window.location?.pathname === '/'
      const shown = sessionStorage.getItem('splashShown') === '1'
      return onHome && !shown
    } catch {
      return false
    }
  })
  const [isAppFading, setIsAppFading] = useState(false)

  // Handle scroll untuk back to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      if (scrollTop > 400) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!isAppLoading) return
    const t1 = setTimeout(() => setIsAppFading(true), 1200)
    const t2 = setTimeout(() => {
      setIsAppLoading(false)
      setIsAppFading(false)
      try { sessionStorage.setItem('splashShown', '1') } catch {}
    }, 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [isAppLoading])

  const openSidebar = () => setIsSidebarOpen(true)
  const closeSidebar = () => setIsSidebarOpen(false)
  const toggleProfileDropdown = () => setIsProfileDropdownOpen(v => !v)

  const isActive = (path: string) => location.pathname === path

  const navigationItems = [
    { name: 'Beranda', path: '/', icon: Home, show: true },
    { name: 'Materi', path: '/materials', icon: BookOpen, show: !!user },
    { name: 'Favorit', path: '/favorites', icon: Bookmark, show: !!user },
    { name: 'Statistik', path: '/stats', icon: BarChart3, show: !!user },
    { name: 'Tentang', path: '/about', icon: Info, show: true },
    { name: 'Kontak', path: '/contact', icon: Mail, show: true },
  ]

  // Navigasi hash (#section) -> smooth scroll
  useEffect(() => {
    const handleHashChange = () => {
      const { hash } = window.location
      if (!hash) return
      const el = document.querySelector(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
    
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [navigate])

  // Smooth scroll to top with visual feedback
  const scrollToTop = () => {
    const button = document.querySelector('[data-back-to-top]')
    if (button) {
      button.classList.add('animate-ping-once')
      setTimeout(() => button.classList.remove('animate-ping-once'), 600)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true)
  }

  const confirmLogout = async () => {
    setShowLogoutConfirmation(false)
    await signOut()
    navigate('/')
  }

  const cancelLogout = () => setShowLogoutConfirmation(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="md:hidden"
              onClick={openSidebar}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.webp" alt="Adata" width={28} height={28} />
              <span className="font-semibold hidden sm:inline">Adata</span>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Button variant="ghost" size="icon" className="hidden md:inline-flex" asChild>
                <Link to="/materials" aria-label="Upload">
                  <FileUp className="h-5 w-5" />
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8">
        <main className="py-6 sm:py-8 lg:py-10 transition-opacity duration-300 ease-out">
          {children}
        </main>

        {/* Right Sidebar Overlay */}
        {user && (
          <Sidebar open={isSidebarOpen} onClose={closeSidebar}>
            {/* Sidebar Header */}
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={closeSidebar}
                  className="transition-all duration-200 hover:scale-110 hover:rotate-90"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 px-6 pt-2 pb-6 space-y-1 overflow-auto">
              {navigationItems
                .filter(item => item.show)
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium 
                                 transition-all duration-200 ease-in-out hover:scale-[1.02] ${
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground shadow-sm transform translate-x-1'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:translate-x-1'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })
              }
            </div>

            {/* User Profile Section */}
            <div className="relative mx-3 mb-3" data-profile-dropdown>
              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="mb-1 rounded-lg border border-border bg-card shadow-md overflow-hidden">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-left px-4 py-3 hover:bg-accent/50 rounded-none" 
                    onClick={handleLogoutClick}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Keluar dari Akun
                  </Button>
                </div>
              )}

              {/* Profile Button */}
              <Button
                variant="ghost"
                className="w-full px-4 py-3 justify-between text-left h-auto hover:bg-accent/50 
                         rounded-lg transition-all duration-200"
                onClick={toggleProfileDropdown}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center 
                                 text-primary-foreground text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {user.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                </div>
                <div className={`transition-transform duration-200 ease-in-out ${
                  isProfileDropdownOpen ? 'rotate-180' : 'rotate-0'
                }`}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </div>
          </Sidebar>
        )}

        {/* Footer */}
        <footer className="py-10 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-3">
            <a href="https://github.com/RizalNurfajri" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <span>•</span>
            <a href="mailto:rizal@example.com" className="inline-flex items-center gap-1 hover:underline">
              <Mail className="h-4 w-4" />
              Email
            </a>
            <span>•</span>
            <a href="tel:+6281234567890" className="inline-flex items-center gap-1 hover:underline">
              <PhoneCall className="h-4 w-4" />
              Kontak
            </a>
          </div>
          <div className="mt-3">© {new Date().getFullYear()} Adata — Made with Luv</div>
        </footer>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          data-back-to-top
          onClick={scrollToTop}
          className="fixed bottom-5 right-5 z-20 
                     h-12 w-12 rounded-full bg-primary text-primary-foreground
                     shadow-lg hover:shadow-xl transition-all duration-200
                     hover:-translate-y-0.5 active:translate-y-0
                     active:scale-95 active:translate-y-0
                     group overflow-hidden"
          size="sm"
        >
          {/* Background animation effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary-foreground/10 to-primary/20 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
          
          {/* Arrow icon */}
          <ArrowUp className="h-6 w-6 relative z-10 transition-all duration-300 ease-out
                            group-hover:scale-110 group-hover:-translate-y-0.5
                            group-active:scale-90" />
          
          {/* Ripple effect */}
          <div className="absolute inset-0 pointer-events-none">
            <span className="absolute inset-0 rounded-full opacity-0 group-active:opacity-40 
                             bg-primary-foreground/30 transition-opacity duration-300" />
          </div>
        </button>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-lg bg-card border border-border shadow-lg">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold">Konfirmasi Keluar</h3>
            </div>
            <div className="p-4 text-sm text-muted-foreground">
              Kamu yakin ingin keluar dari akun?
            </div>
            <div className="p-3 flex justify-end gap-2 border-t border-border">
              <Button variant="ghost" onClick={cancelLogout}>Batal</Button>
              <Button variant="destructive" onClick={confirmLogout}>Keluar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Splash / Loading overlay (opsional) */}
      {isAppLoading && (
        <div className={`fixed inset-0 z-[10000] grid place-items-center bg-background transition-opacity duration-400 ${isAppFading ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm text-muted-foreground">Memuat Adata…</span>
          </div>
        </div>
      )}
    </div>
  )
}