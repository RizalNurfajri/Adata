import { useState, useEffect, useRef, useCallback } from 'react'
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
  
  // Optimized refs for direct DOM manipulation
  const backToTopRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

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

  // Optimized scroll handler with throttling
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) return
    
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const shouldShow = scrollTop > 300
      
      if (shouldShow !== showBackToTop) {
        setShowBackToTop(shouldShow)
      }
      scrollTimeoutRef.current = undefined
    }, 16) // ~60fps throttling
  }, [showBackToTop])

  // Handle scroll untuk back to top button
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll])

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

  // Optimized scroll to top with GPU acceleration
  const scrollToTop = useCallback(() => {
    const button = backToTopRef.current
    if (button) {
      // Direct style manipulation untuk performa terbaik
      button.style.transform = 'translate3d(0, 0, 0) scale(0.95)'
      button.style.transition = 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
      
      setTimeout(() => {
        button.style.transform = 'translate3d(0, 0, 0) scale(1.05)'
        setTimeout(() => {
          button.style.transform = 'translate3d(0, 0, 0) scale(1)'
        }, 150)
      }, 150)
    }
    
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])

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

  // Optimized sidebar toggle with GPU acceleration
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const newState = !prev
      
      // Prepare GPU layers sebelum animation
      if (sidebarRef.current && backdropRef.current) {
        if (newState) {
          sidebarRef.current.style.willChange = 'transform'
          backdropRef.current.style.willChange = 'opacity'
        } else {
          // Cleanup will-change setelah animation selesai
          setTimeout(() => {
            if (sidebarRef.current && backdropRef.current) {
              sidebarRef.current.style.willChange = 'auto'
              backdropRef.current.style.willChange = 'auto'
            }
          }, 250)
        }
      }
      
      return newState
    })
    
    // Close dropdown when toggling sidebar
    if (isProfileDropdownOpen) {
      setIsProfileDropdownOpen(false)
    }
  }, [isProfileDropdownOpen])

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
    setIsProfileDropdownOpen(false)
  }, [])

  const toggleProfileDropdown = useCallback(() => {
    setIsProfileDropdownOpen(prev => !prev)
  }, [])

  // Close sidebar when route changes
  useEffect(() => {
    closeSidebar()
  }, [location.pathname, closeSidebar])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-profile-dropdown]')) {
        setIsProfileDropdownOpen(false)
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside, { passive: true })
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
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.webp" alt="Adata" className="h-6 w-6" />
              <span className="text-xl font-bold text-foreground">Adata</span>
            </Link>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              
              {/* Menu button - Optimized untuk GPU */}
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="relative"
                  style={{
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)'
                  }}
                >
                  <Menu 
                    className="h-5 w-5"
                    style={{
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isSidebarOpen 
                        ? 'rotate3d(0, 0, 1, 90deg)' 
                        : 'rotate3d(0, 0, 1, 0deg)',
                      willChange: 'transform'
                    }}
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Right Sidebar Overlay - GPU Optimized */}
        {user && (
          <div 
            className="fixed inset-0 z-40 pointer-events-none"
            style={{
              opacity: isSidebarOpen ? 1 : 0,
              transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: isSidebarOpen ? 'auto' : 'none'
            }}
          >
            {/* Backdrop - GPU Optimized */}
            <div 
              ref={backdropRef}
              className="fixed inset-0"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${isSidebarOpen ? '0.5' : '0'})`,
                transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: isSidebarOpen ? 'blur(4px)' : 'blur(0px)'
              }}
              onClick={closeSidebar} 
            />
            
            {/* Sidebar - GPU Optimized */}
            <aside 
              ref={sidebarRef}
              className="fixed right-0 top-0 w-full sm:w-96 md:w-80 bg-card h-full shadow-xl flex flex-col"
              style={{
                transform: isSidebarOpen 
                  ? 'translate3d(0, 0, 0)' 
                  : 'translate3d(100%, 0, 0)',
                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: isSidebarOpen ? 'transform' : 'auto'
              }}
            >
              {/* Sidebar Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={closeSidebar}
                    className="relative"
                    style={{
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      willChange: 'transform'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1.1) rotate3d(0, 0, 1, 90deg)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1) rotate3d(0, 0, 1, 0deg)'
                    }}
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
                    const active = isActive(item.path)
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={closeSidebar}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium 
                                   block relative overflow-hidden ${
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                        style={{
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          transform: active ? 'translate3d(4px, 0, 0)' : 'translate3d(0, 0, 0)',
                          willChange: 'transform'
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.transform = 'translate3d(4px, 0, 0) scale(1.02)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)'
                          }
                        }}
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
                {/* Dropdown Menu - GPU Optimized */}
                {isProfileDropdownOpen && (
                  <div 
                    className="absolute bottom-full left-0 right-0 bg-card shadow-lg border border-border rounded-t-lg mb-1"
                    style={{
                      animation: 'slideInFromBottom 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: 'translate3d(0, 0, 0)',
                      willChange: 'transform'
                    }}
                  >
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left px-4 py-3 rounded-t-lg"
                      style={{
                        transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onClick={handleLogoutClick}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'hsl(var(--accent))'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Keluar dari Akun
                    </Button>
                  </div>
                )}

                {/* Profile Button */}
                <Button
                  variant="ghost"
                  className="w-full px-4 py-3 justify-between text-left h-auto rounded-lg"
                  onClick={toggleProfileDropdown}
                  style={{
                    transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--accent) / 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
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
                  <ChevronDown 
                    className="h-4 w-4 text-muted-foreground"
                    style={{
                      transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isProfileDropdownOpen 
                        ? 'rotate3d(0, 0, 1, 180deg)' 
                        : 'rotate3d(0, 0, 1, 0deg)',
                      willChange: 'transform'
                    }}
                  />
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Back to Top Button - GPU Optimized */}
      <div
        className="fixed bottom-6 right-6 z-50"
        style={{
          opacity: showBackToTop ? 1 : 0,
          transform: showBackToTop 
            ? 'translate3d(0, 0, 0) scale(1)' 
            : 'translate3d(0, 32px, 0) scale(0.75)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: showBackToTop ? 'auto' : 'none',
          willChange: 'transform, opacity'
        }}
      >
        <Button
          ref={backToTopRef}
          onClick={scrollToTop}
          className="relative w-14 h-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 group overflow-hidden"
          size="sm"
          style={{
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate3d(0, -4px, 0) scale(1.1)'
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)'
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Background animation effect */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary-foreground/10 to-primary/20"
            style={{
              transform: 'translate3d(-100%, 0, 0)',
              transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate3d(100%, 0, 0)'
            }}
          />
          
          {/* Arrow icon */}
          <ArrowUp 
            className="h-6 w-6 relative z-10"
            style={{
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform'
            }}
          />
          
          {/* Ripple effect */}
          <div 
            className="absolute inset-0 rounded-full bg-primary-foreground/20"
            style={{
              transform: 'scale(0)',
              opacity: 1,
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform, opacity'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.opacity = '0'
            }}
          />
        </Button>
      </div>

      {/* Logout Confirmation Modal - GPU Optimized */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={cancelLogout}
          />
          
          {/* Modal */}
          <div 
            className="relative bg-card border border-border rounded-lg shadow-2xl p-6 mx-4 max-w-md w-full"
            style={{
              animation: 'modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'translate3d(0, 0, 0)',
              willChange: 'transform'
            }}
          >
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
                className="px-4 py-2"
                style={{
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'transform'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)'
                }}
              >
                Batal
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="px-4 py-2"
                style={{
                  transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'transform'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate3d(0, 0, 0) scale(1)'
                }}
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="px-4 sm:px-6 lg:px-8">
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
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background"
          style={{
            opacity: isAppFading ? 0 : 1,
            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isAppFading ? 'none' : 'auto'
          }}
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

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translate3d(0, 0, 0) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}