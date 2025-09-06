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
      setShowBackToTop(scrollTop > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ====== Loading simulation with smooth fade out ======
  useEffect(() => {
    if (!isAppLoading) return
    
    const showMs = 3000
    const fadeMs = 500

    const timer = setTimeout(() => {
      setIsAppFading(true)
      
      const fadeTimer = setTimeout(() => {
        setIsAppLoading(false)
        try { 
          sessionStorage.setItem('splashShown', '1') 
        } catch (e) {
          console.warn('SessionStorage not available:', e)
        }
      }, fadeMs)
      
      return () => clearTimeout(fadeTimer)
    }, showMs)

    return () => clearTimeout(timer)
  }, [isAppLoading])

  // ====== OTP expired redirect handler ======
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || ''
      if (hash.includes('error_code=otp_expired')) {
        navigate('/link-expired', { replace: true })
      }
    }
    
    // Check on mount
    handleHashChange()
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [navigate])

  // Smooth scroll to top with visual feedback
  const scrollToTop = () => {
    const button = document.querySelector('[data-back-to-top]')
    if (button) {
      button.classList.add('animate-pulse')
      setTimeout(() => {
        button.classList.remove('animate-pulse')
      }, 400)
    }
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // Reset all state
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
  }

  const cancelLogout = () => {
    setShowLogoutConfirmation(false)
  }

  const isActive = (path: string) => location.pathname === path

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
    // Close dropdown when toggling sidebar
    if (isProfileDropdownOpen) {
      setIsProfileDropdownOpen(false)
    }
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
    setIsProfileDropdownOpen(false)
  }

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(prev => !prev)
  }

  // Close sidebar when route changes
  useEffect(() => {
    closeSidebar()
  }, [location.pathname])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-profile-dropdown]')) {
        setIsProfileDropdownOpen(false)
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileDropdownOpen])

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
      <nav className="border-b bg-card sticky top-0 z-50">
        {/* ➜ Tambah container + max width */}
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.webp" alt="Adata" className="h-6 w-6" />
              <span className="text-xl font-bold text-foreground">Adata</span>
            </Link>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {/* Menu button */}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="relative transition-all duration-300 hover:scale-105"
                >
                  <Menu 
                    className={`h-5 w-5 transition-transform duration-200 ease-out ${
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
      <div className="flex flex-1">
        {/* Main Content */}
        {/* ➜ Bungkus children dengan container + max width */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>

        {/* Right Sidebar Overlay */}
        {user && (
          <div 
            className={`fixed inset-0 z-40 transition-all duration-200 ease-out ${
              isSidebarOpen 
                ? 'opacity-100 pointer-events-auto' 
                : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Backdrop */}
            <div 
              className={`fixed inset-0 bg-black transition-opacity duration-200 ease-out ${
                isSidebarOpen ? 'bg-opacity-50' : 'bg-opacity-0'
              }`}
              onClick={closeSidebar} 
            />
            
            {/* Sidebar */}
            <aside 
              className={`fixed right-0 top-0 w-full sm:w-96 md:w-80 bg-card h-full shadow-xl 
                         transform transition-transform duration-200 ease-out flex flex-col will-change-transform ${
                isSidebarOpen 
                  ? 'translate-x-0' 
                  : 'translate-x-full'
              }`}
            >
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
              <div className="flex-1 px-6 pt-2 pb-6 space-y-1">
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
                  <div className="absolute bottom-full left-0 right-0 bg-card shadow-lg border border-border 
                                 rounded-t-lg mb-1 animate-in slide-in-from-bottom-2 duration-200">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left px-4 py-3 rounded-t-lg hover:bg-accent/50 
                               transition-colors duration-200" 
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
        >
          {/* Background animation effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary-foreground/10 to-primary/20 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
          
          {/* Arrow icon */}
          <ArrowUp className="h-6 w-6 relative z-10 transition-all duration-300 ease-out
                            group-hover:scale-110 group-hover:-translate-y-0.5
                            group-active:scale-90" />
          
          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full bg-primary-foreground/20 scale-0 
                          group-hover:scale-100 group-hover:opacity-0 
                          transition-all duration-500 ease-out opacity-100" />
        </Button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={cancelLogout}
          />
          
          {/* Modal */}
          <div className="relative bg-card border border-border rounded-lg shadow-2xl p-6 mx-4 max-w-md w-full 
                         animate-in fade-in-0 zoom-in-95 duration-300 ease-out">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full 
                             flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Konfirmasi Keluar
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Apakah Anda yakin ingin keluar dari akun?
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <Button 
                variant="outline" 
                onClick={cancelLogout}
                className="px-4 py-2 transition-all duration-200 hover:scale-105"
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="px-4 py-2 transition-all duration-200 hover:scale-105"
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t bg-card">
        {/* ➜ Tambah container + max width */}
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="text-sm text-muted-foreground">
              © 2025 Adata. Made With ♥ For RKS 3A.
            </div>
          </div>
        </div>
      </footer>

      {/* Loading Overlay */}
      {isAppLoading && (
        <div
          className={`fixed inset-0 z-[70] flex items-center justify-center bg-background 
                     transition-opacity duration-500 ease-out ${
            isAppFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* @ts-ignore: web component */}
          <lottie-player
            src="/animations/loading.json"
            background="transparent"
            speed="1"
            loop
            autoplay
            style={{ width: '160px', height: '160px' }}
          />
        </div>
      )}
    </div>
  )
}
