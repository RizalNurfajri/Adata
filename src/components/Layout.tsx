import { useState, useEffect } from 'react'
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
  UserCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowUp
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  // Loading state untuk splash screen - hanya tampil di home page sekali per session
  const [isAppLoading, setIsAppLoading] = useState<boolean>(() => {
    try {
      const onHome = typeof window !== 'undefined' && window.location?.pathname === '/'
      const shown = typeof window !== 'undefined' && sessionStorage.getItem('splashShown') === '1'
      return onHome && !shown
    } catch {
      return false
    }
  })
  const [isAppFading, setIsAppFading] = useState(false)

  // Handle scroll untuk back to top button dengan throttling
  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          setShowBackToTop(scrollTop > 300)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Loading animation dengan timing yang lebih baik
  useEffect(() => {
    if (!isAppLoading) return
    
    const showMs = 2500 // Dikurangi sedikit untuk UX yang lebih responsif
    const fadeMs = 400

    const loadingTimer = setTimeout(() => {
      setIsAppFading(true)
      const fadeTimer = setTimeout(() => {
        setIsAppLoading(false)
        try { 
          sessionStorage.setItem('splashShown', '1') 
        } catch (e) {
          console.warn('Session storage not available')
        }
      }, fadeMs)
      return () => clearTimeout(fadeTimer)
    }, showMs)

    return () => clearTimeout(loadingTimer)
  }, [isAppLoading])

  // Handle OTP expired redirect
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || ''
      if (hash.includes('error_code=otp_expired')) {
        navigate('/link-expired', { replace: true })
      }
    }
    
    // Check on mount
    handleHashChange()
    // Listen untuk hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [navigate])

  // Close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false)
    setIsProfileDropdownOpen(false)
  }, [location.pathname])

  // Close dropdowns ketika klik outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Close profile dropdown jika klik di luar
      if (isProfileDropdownOpen && !target.closest('[data-profile-dropdown]')) {
        setIsProfileDropdownOpen(false)
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileDropdownOpen])

  // Scroll to top dengan feedback visual yang lebih smooth
  const scrollToTop = () => {
    const button = document.querySelector('[data-back-to-top]') as HTMLElement
    if (button) {
      button.style.transform = 'scale(0.9) translateY(2px)'
      setTimeout(() => {
        button.style.transform = ''
      }, 150)
    }
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsSidebarOpen(false)
      setIsProfileDropdownOpen(false)
      setShowLogoutConfirmation(false)
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true)
    setIsProfileDropdownOpen(false) // Close dropdown saat modal muncul
  }

  const cancelLogout = () => {
    setShowLogoutConfirmation(false)
  }

  const isActive = (path: string) => location.pathname === path

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
    // Close profile dropdown jika sidebar ditutup
    if (isSidebarOpen) {
      setIsProfileDropdownOpen(false)
    }
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
    setIsProfileDropdownOpen(false)
  }

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen)
  }

  const navigationItems = [
    {
      name: 'Semester',
      path: '/',
      icon: Home,
      show: true
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3,
      show: !!user
    },
    {
      name: 'Tambah Materi',
      path: '/tambah',
      icon: Plus,
      show: profile?.role === 'admin'
    },
    {
      name: 'Admin',
      path: '/admin/dashboard',
      icon: Settings,
      show: profile?.role === 'admin'
    }
  ]

  // Prevent body scroll ketika sidebar terbuka
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup saat component unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isSidebarOpen])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="border-b bg-card/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo dengan hover effect */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 group transition-transform duration-200 hover:scale-105"
            >
              <img 
                src="/logo.webp" 
                alt="Adata" 
                className="h-6 w-6 transition-transform duration-200 group-hover:rotate-12" 
              />
              <span className="text-xl font-bold text-foreground">Adata</span>
            </Link>

            {/* Right side items */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              
              {/* Menu button dengan indicator untuk sidebar state */}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className={`relative transition-all duration-200 hover:scale-105 hover:bg-accent/80 ${
                    isSidebarOpen ? 'bg-accent text-accent-foreground' : ''
                  }`}
                  aria-label="Toggle menu"
                >
                  <Menu 
                    className={`h-5 w-5 transition-transform duration-300 ${
                      isSidebarOpen ? 'rotate-90' : 'rotate-0'
                    }`} 
                  />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content Wrapper */}
      <div className="flex flex-1 relative">
        {/* Main Content dengan padding yang konsisten */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </main>

        {/* Right Sidebar Overlay dengan improved animations */}
        {user && (
          <>
            {/* Backdrop dengan blur effect */}
            <div 
              className={`fixed inset-0 z-40 transition-all duration-300 ease-out ${
                isSidebarOpen 
                  ? 'opacity-100 pointer-events-auto backdrop-blur-sm' 
                  : 'opacity-0 pointer-events-none'
              }`}
              style={{ 
                backgroundColor: isSidebarOpen ? 'rgba(0, 0, 0, 0.5)' : 'transparent' 
              }}
              onClick={closeSidebar} 
            />
            
            {/* Sidebar dengan improved shadow dan animations */}
            <aside 
              className={`fixed right-0 top-0 w-full sm:w-96 md:w-80 bg-card/95 backdrop-blur-sm h-full shadow-2xl transform transition-all duration-300 ease-out flex flex-col border-l border-border/50 ${
                isSidebarOpen 
                  ? 'translate-x-0' 
                  : 'translate-x-full'
              }`}
              style={{
                boxShadow: isSidebarOpen 
                  ? '-10px 0 30px -5px rgba(0, 0, 0, 0.3)' 
                  : 'none'
              }}
            >
              {/* Sidebar Header dengan better spacing */}
              <div className="p-6 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Menu
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={closeSidebar}
                    className="transition-all duration-200 hover:scale-110 hover:rotate-90 hover:bg-accent/80"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Navigation Section dengan better spacing */}
              <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigationItems
                  .filter(item => item.show)
                  .map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeSidebar}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                          active
                            ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:scale-[1.01]'
                        }`}
                      >
                        <Icon className={`h-5 w-5 transition-transform duration-200 ${
                          active ? '' : 'group-hover:scale-110'
                        }`} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })
                }
              </div>

              {/* User Profile Section dengan better positioning */}
              <div className="relative mx-4 mb-4" data-profile-dropdown>
                {/* Dropdown Menu - Opens upward dengan better animation */}
                {isProfileDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 bg-card/95 backdrop-blur-sm shadow-xl border border-border/50 rounded-xl mb-2 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left px-4 py-3 rounded-xl hover:bg-accent/80 transition-colors duration-200" 
                      onClick={handleLogoutClick}
                    >
                      <LogOut className="h-4 w-4 mr-3 text-red-500" />
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Keluar dari Akun
                      </span>
                    </Button>
                  </div>
                )}

                {/* Profile Button dengan better styling */}
                <Button
                  variant="ghost"
                  className="w-full px-4 py-3 justify-between text-left h-auto hover:bg-accent/80 rounded-xl transition-all duration-200 border border-border/30"
                  onClick={toggleProfileDropdown}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold shadow-sm">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {user.email.split('@')[0]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {profile?.role === 'admin' ? 'Administrator' : 'Pengguna'}
                      </span>
                    </div>
                  </div>
                  <div className={`transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180' : 'rotate-0'
                  }`}>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Button>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Back to Top Button dengan improved positioning dan animation */}
      <div
        className={`fixed bottom-6 right-6 z-30 transition-all duration-500 ease-out ${
          showBackToTop 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-75 translate-y-8 pointer-events-none'
        }`}
      >
        <Button
          data-back-to-top
          onClick={scrollToTop}
          className="relative w-12 h-12 rounded-full shadow-lg transition-all duration-300 ease-out
                     bg-primary hover:bg-primary/90 
                     hover:scale-110 hover:shadow-xl hover:-translate-y-1
                     active:scale-95 active:translate-y-0
                     group overflow-hidden"
          size="sm"
          aria-label="Scroll to top"
        >
          {/* Background shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
          
          {/* Arrow icon */}
          <ArrowUp className="h-5 w-5 relative z-10 transition-all duration-200 
                            group-hover:scale-110 group-hover:-translate-y-0.5" />
        </Button>
      </div>

      {/* Logout Confirmation Modal dengan improved design */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop dengan blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={cancelLogout}
          />
          
          {/* Modal dengan better animation */}
          <div className="relative bg-card/95 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl p-6 mx-4 max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Konfirmasi Keluar
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Apakah Anda yakin ingin keluar dari akun? Anda perlu login kembali untuk mengakses aplikasi.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <Button 
                variant="outline" 
                onClick={cancelLogout}
                className="px-6 py-2 transition-all duration-200 hover:scale-105"
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="px-6 py-2 transition-all duration-200 hover:scale-105"
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer dengan better responsive design */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-14">
            <div className="text-sm text-muted-foreground text-center">
              © 2025 Adata. Made With{' '}
              <span className="text-red-500 inline-block animate-pulse">♥</span>
              {' '}For RKS 3A.
            </div>
          </div>
        </div>
      </footer>

      {/* Loading Overlay dengan improved z-index dan transition */}
      {isAppLoading && (
        <div
          className={`fixed inset-0 z-[60] flex items-center justify-center bg-background transition-all duration-400 ease-out ${
            isAppFading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          style={{ 
            pointerEvents: isAppFading ? 'none' : 'auto' 
          }}
        >
          {/* Loading animation container */}
          <div className="flex flex-col items-center space-y-4">
            {/* @ts-ignore: web component */}
            <lottie-player
              src="/animations/loading.json"
              background="transparent"
              speed="1"
              loop
              autoplay
              style={{ width: '140px', height: '140px' }}
            />
            
            {/* Optional loading text */}
            <div className="text-sm text-muted-foreground font-medium">
              Memuat aplikasi...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}