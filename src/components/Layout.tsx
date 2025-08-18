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

// Komponen Loading Screen dengan Lottie
const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Simulasi loading time minimum 2 detik
    const timer = setTimeout(() => {
      setIsLoaded(true)
      // Delay sedikit untuk animasi fade out
      setTimeout(onComplete, 500)
    }, 2000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 transition-all duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent rounded-full blur-2xl animate-pulse delay-700" />
      </div>

      {/* Logo dan Animasi */}
      <div className="relative z-10 text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 animate-in fade-in-0 slide-in-from-top-4 duration-1000">
          <img src="/logo.webp" alt="Adata" className="h-16 w-16 animate-bounce" />
          <span className="text-4xl font-bold text-foreground">Adata</span>
        </div>

        {/* Lottie Animation Container */}
        <div className="w-64 h-64 mx-auto animate-in fade-in-0 zoom-in-95 duration-1000 delay-300">
          <iframe 
            src="https://lottie.host/5ba352dc-9619-4171-86ea-c433edb3e19f/LY2AOvb8Fo.json"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Loading Animation"
          />
        </div>

        {/* Loading Text */}
        <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-1000 delay-500">
          <p className="text-lg font-medium text-foreground">
            Mempersiapkan Dashboard Anda
          </p>
          
          {/* Loading Dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
          </div>

          {/* Progress Bar */}
          <div className="w-64 mx-auto bg-muted rounded-full h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent animate-[loading_2s_ease-in-out]" />
          </div>
        </div>

        {/* Welcome Message */}
        <p className="text-sm text-muted-foreground animate-in fade-in-0 duration-1000 delay-1000">
          Selamat datang di platform pembelajaran RKS 3 A
        </p>
      </div>

      {/* Custom CSS untuk animasi progress bar */}
      <style jsx>{`
        @keyframes loading {
          0% {
            width: 0%;
            opacity: 0.3;
          }
          50% {
            width: 60%;
            opacity: 1;
          }
          100% {
            width: 100%;
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
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
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)

  // Handle initial loading screen
  useEffect(() => {
    // Cek apakah ini adalah first visit
    const hasVisited = sessionStorage.getItem('hasVisited')
    
    if (!hasVisited) {
      // First visit, show loading screen
      sessionStorage.setItem('hasVisited', 'true')
      setShowLoadingScreen(true)
    } else {
      // Not first visit, skip loading
      setShowLoadingScreen(false)
      setIsInitialLoad(false)
    }
  }, [])

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false)
    setIsInitialLoad(false)
  }

  // Handle scroll untuk back to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      setShowBackToTop(scrollTop > 300) // Show button after scrolling 300px
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Function untuk scroll ke atas dengan animasi feedback
  const scrollToTop = () => {
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
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsSidebarOpen(false)
      setIsProfileDropdownOpen(false)
      setShowLogoutConfirmation(false)
      // Reset loading screen untuk next visit
      sessionStorage.removeItem('hasVisited')
      // Redirect ke halaman login setelah logout
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
    setIsSidebarOpen(!isSidebarOpen)
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

  // Show loading screen during initial load
  if (showLoadingScreen) {
    return <LoadingScreen onComplete={handleLoadingComplete} />
  }

  return (
    <div className={`min-h-screen bg-background flex flex-col transition-all duration-1000 ${
      isInitialLoad ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
    }`}>
      {/* Top Navigation Bar */}
      <nav className="border-b bg-card sticky top-0 z-50 animate-in slide-in-from-top-4 duration-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 animate-in fade-in-0 slide-in-from-left-4 duration-700 delay-200">
              <img src="/logo.webp" alt="Adata" className="h-6 w-6 hover:scale-110 transition-transform duration-300" />
              <span className="text-xl font-bold text-foreground">Adata</span>
            </Link>

            {/* Right side items */}
            <div className="flex items-center space-x-4 animate-in fade-in-0 slide-in-from-right-4 duration-700 delay-300">
              <ThemeToggle />
              
              {/* Menu button - always visible when user is logged in */}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="relative transition-transform duration-200 hover:scale-105"
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-400">
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
              className={`fixed right-0 top-0 w-full sm:w-96 md:w-80 bg-card h-full shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
                isSidebarOpen 
                  ? 'translate-x-0' 
                  : 'translate-x-full'
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Menu
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={closeSidebar}
                    className="transition-transform duration-200 hover:scale-110 hover:rotate-90"
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
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02] ${
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

              {/* User Profile Section - Fixed at bottom */}
              <div className="relative mx-3 mb-3">
                {/* Dropdown Menu - Opens upward */}
                {isProfileDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 bg-card shadow-lg border border-border rounded-t-lg mb-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left px-4 py-3 rounded-t-lg hover:bg-accent/50" 
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
                  className="w-full px-4 py-3 justify-between text-left h-auto hover:bg-accent/50 rounded-lg"
                  onClick={toggleProfileDropdown}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {user.email.split('@')[0]}
                      </span>
                    </div>
                  </div>
                  {isProfileDropdownOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
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
          
          {/* Arrow icon with bounce animation */}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelLogout}
          />
          
          {/* Modal */}
          <div className="relative bg-card border border-border rounded-lg shadow-2xl p-6 mx-4 max-w-md w-full animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
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
                className="px-4 py-2"
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="px-4 py-2"
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Sticky Footer */}
      <footer className="border-t bg-card animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-500">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-16">
            <div className="text-sm text-muted-foreground">
              © 2025 Adata. Made With ♥ For RKS 3 A.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}