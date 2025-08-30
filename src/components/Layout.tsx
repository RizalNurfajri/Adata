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

  // State untuk overlay loading dengan type safety dan error handling yang lebih baik
  const [isAppLoading, setIsAppLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    
    try {
      const onHome = window.location?.pathname === '/'
      const shown = sessionStorage.getItem('splashShown') === '1'
      return onHome && !shown
    } catch (error) {
      console.error('Error accessing sessionStorage:', error)
      return false
    }
  })
  const [isAppFading, setIsAppFading] = useState(false)

  // Handle scroll untuk back to top button dengan debounce
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

  // Simulasi loading awal + animasi fade out dengan cleanup yang lebih baik
  useEffect(() => {
    if (!isAppLoading) return

    const showMs = 3000
    const fadeMs = 300

    const timeoutId = setTimeout(() => {
      setIsAppFading(true)
      
      const fadeTimeoutId = setTimeout(() => {
        setIsAppLoading(false)
        try { 
          sessionStorage.setItem('splashShown', '1') 
        } catch (error) {
          console.error('Error setting sessionStorage:', error)
        }
      }, fadeMs)

      return () => clearTimeout(fadeTimeoutId)
    }, showMs)

    return () => clearTimeout(timeoutId)
  }, [isAppLoading])

  // Handle hash error dengan cleanup yang proper
  useEffect(() => {
    const handleHashError = () => {
      try {
        const hash = window.location.hash || ''
        if (hash.includes('error_code=otp_expired')) {
          navigate('/link-expired', { replace: true })
        }
      } catch (error) {
        console.error('Error handling hash:', error)
      }
    }

    // Check saat mount
    handleHashError()
    
    // Listen untuk perubahan hash
    window.addEventListener('hashchange', handleHashError)
    return () => window.removeEventListener('hashchange', handleHashError)
  }, [navigate])

  // Close sidebar saat route berubah
  useEffect(() => {
    setIsSidebarOpen(false)
    setIsProfileDropdownOpen(false)
  }, [location.pathname])

  // Close dropdown dan sidebar saat klik outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-sidebar]') && !target.closest('[data-menu-button]')) {
        setIsSidebarOpen(false)
        setIsProfileDropdownOpen(false)
      }
    }

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSidebarOpen])

  // Function untuk scroll ke atas dengan animasi feedback
  const scrollToTop = () => {
    try {
      // Trigger visual feedback
      const button = document.querySelector('[data-back-to-top]')
      if (button) {
        button.classList.add('animate-pulse')
        setTimeout(() => {
          button.classList.remove('animate-pulse')
        }, 300)
      }
      
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    } catch (error) {
      console.error('Error scrolling to top:', error)
    }
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
      // Tetap redirect meski ada error
      navigate('/login')
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true)
  }

  const cancelLogout = () => {
    setShowLogoutConfirmation(false)
  }

  const isActive = (path: string) => location.pathname === path

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
    setIsProfileDropdownOpen(false)
  }

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen)
  }

  // Close modal dengan ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showLogoutConfirmation) {
          setShowLogoutConfirmation(false)
        } else if (isSidebarOpen) {
          setIsSidebarOpen(false)
          setIsProfileDropdownOpen(false)
        }
      }
    }

    document.addEventListener('keydown', handleEscKey)
    return () => document.removeEventListener('keydown', handleEscKey)
  }, [showLogoutConfirmation, isSidebarOpen])

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 transition-transform duration-200 hover:scale-105"
            >
              <img 
                src="/logo.webp" 
                alt="Adata" 
                className="h-6 w-6"
                onError={(e) => {
                  // Fallback jika logo tidak ditemukan
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <span className="text-xl font-bold text-foreground">Adata</span>
            </Link>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {/* Menu button - always visible when user is logged in */}
              {user && (
                <Button
                  data-menu-button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="relative transition-transform duration-200 hover:scale-105"
                  aria-label="Toggle menu"
                  aria-expanded={isSidebarOpen}
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

      {/* Content Wrapper - Flex grow untuk mengisi ruang yang tersisa */}
      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>

        {/* Right Sidebar Overlay */}
        {user && (
          <div 
            className={`fixed inset-0 z-40 transition-opacity duration-300 ${
              isSidebarOpen 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Backdrop */}
            <div 
              className={`fixed inset-0 bg-black transition-opacity duration-300 ${
                isSidebarOpen ? 'bg-opacity-50' : 'bg-opacity-0'
              }`}
              onClick={closeSidebar} 
            />
            
            {/* Sidebar */}
            <aside 
              data-sidebar
              className={`fixed right-0 top-0 w-full sm:w-96 md:w-80 bg-card h-full shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border ${
                isSidebarOpen 
                  ? 'translate-x-0' 
                  : 'translate-x-full'
              }`}
              role="dialog"
              aria-label="Navigation menu"
            >
              {/* Sidebar Header */}
              <div className="p-4 sm:p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Menu
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={closeSidebar}
                    className="transition-transform duration-200 hover:scale-110 hover:rotate-90"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Navigation Section */}
              <div className="flex-1 px-6 pt-4 pb-6 space-y-1 overflow-y-auto">
                <nav role="navigation" aria-label="Main navigation">
                  {navigationItems
                    .filter(item => item.show)
                    .map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={closeSidebar}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] group ${
                            isActive(item.path)
                              ? 'bg-primary text-primary-foreground shadow-sm transform translate-x-1'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent hover:translate-x-1'
                          }`}
                          aria-current={isActive(item.path) ? 'page' : undefined}
                        >
                          <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })
                  }
                </nav>
              </div>

              {/* User Profile Section - Fixed at bottom */}
              <div className="relative mx-3 mb-3 border-t border-border pt-3">
                {/* Dropdown Menu - Opens upward */}
                {isProfileDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 bg-card shadow-lg border border-border rounded-t-lg mb-1 overflow-hidden">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left px-4 py-3 rounded-t-lg hover:bg-accent/50 transition-colors duration-200" 
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
                  className="w-full px-4 py-3 justify-between text-left h-auto hover:bg-accent/50 rounded-lg transition-colors duration-200"
                  onClick={toggleProfileDropdown}
                  aria-expanded={isProfileDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium flex-shrink-0">
                      {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {user?.email?.split('@')[0] || 'User'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isProfileDropdownOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                    )}
                  </div>
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
          showBackToTop 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-75 translate-y-8 pointer-events-none'
        }`}
      >
        <Button
          data-back-to-top
          onClick={scrollToTop}
          className="relative w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ease-out
                     bg-primary hover:bg-primary/90 
                     hover:scale-110 hover:shadow-xl hover:-translate-y-1
                     active:scale-95 active:translate-y-0
                     group overflow-hidden"
          size="sm"
          aria-label="Back to top"
        >
          {/* Background animation effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary-foreground/10 to-primary/20 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
          
          {/* Arrow icon dengan bounce animation */}
          <ArrowUp className="h-6 w-6 relative z-10 transition-all duration-300 
                            group-hover:scale-110 group-hover:-translate-y-0.5
                            group-active:scale-90" />
          
          {/* Ripple effect on hover */}
          <div className="absolute inset-0 rounded-full bg-primary-foreground/20 scale-0 
                          group-hover:scale-100 group-hover:opacity-0 
                          transition-all duration-500 ease-out opacity-100" />
        </Button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={cancelLogout}
            aria-hidden="true"
          />
          
          {/* Modal */}
          <div 
            className="relative bg-card border border-border rounded-lg shadow-2xl p-6 mx-4 max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-200"
            role="dialog"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
          >
            <div className="flex items-start space-x-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <h3 id="logout-title" className="text-lg font-semibold text-foreground">
                  Konfirmasi Keluar
                </h3>
                <p id="logout-description" className="text-sm text-muted-foreground mt-1">
                  Apakah Anda yakin ingin keluar dari akun?
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button 
                variant="outline" 
                onClick={cancelLogout}
                className="px-4 py-2 order-2 sm:order-1"
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="px-4 py-2 order-1 sm:order-2"
                autoFocus
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Sticky Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="text-sm text-muted-foreground text-center">
              © 2025 Adata. Made With ♥ For RKS 3A.
            </div>
          </div>
        </div>
      </footer>

      {/* Overlay Loading Lottie */}
      {isAppLoading && (
        <div
          className={`fixed inset-0 z-[70] flex items-center justify-center bg-background transition-opacity duration-300 ${
            isAppFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-hidden="true"
        >
          <div className="flex flex-col items-center space-y-4">
            {/* @ts-ignore: web component */}
            <lottie-player
              src="/animations/loading.json"
              background="transparent"
              speed="1"
              loop
              autoplay
              style={{ width: '160px', height: '160px' }}
            />
            <div className="text-sm text-muted-foreground animate-pulse">
              Memuat aplikasi...
            </div>
          </div>
        </div>
      )}
    </div>
  )
}