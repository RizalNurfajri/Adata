import { useState } from 'react'
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
  ChevronUp
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsSidebarOpen(false)
      setIsProfileDropdownOpen(false)
      // Redirect ke halaman login setelah logout
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
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

      <div className="flex flex-1">
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Unified Sidebar - Smooth transition between collapsed/expanded */}
        {user && (
          <>
            {/* Backdrop untuk expanded sidebar */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
                onClick={closeSidebar} 
              />
            )}
            
            {/* Sidebar Container */}
            <aside 
              className={`${
                isSidebarOpen ? 'fixed right-0 top-0 h-full z-40' : 'relative'
              } bg-card border-l shadow-sm flex flex-col py-4 transition-all duration-300 ease-in-out ${
                isSidebarOpen ? 'w-full sm:w-96 md:w-80' : 'w-16'
              }`}
            >
              {/* Header - hanya muncul saat expanded */}
              {isSidebarOpen && (
                <div className="p-4 sm:p-6 pb-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Menu</h2>
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
              )}
              
              {/* Navigation Section */}
              <div className={`flex-1 space-y-1 ${isSidebarOpen ? 'px-6 pt-2 pb-6' : 'px-2'}`}>
                {navigationItems
                  .filter(item => item.show)
                  .map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={isSidebarOpen ? closeSidebar : undefined}
                        className={`flex items-center rounded-lg text-sm font-medium transition-all duration-300 group relative ${
                          isSidebarOpen 
                            ? 'space-x-3 px-4 py-3 hover:scale-[1.02]' 
                            : 'justify-center p-3 hover:scale-110'
                        } ${
                          isActive(item.path)
                            ? 'bg-primary text-primary-foreground shadow-sm' + (isSidebarOpen ? ' transform translate-x-1' : '')
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent' + (isSidebarOpen ? ' hover:translate-x-1' : '')
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {isSidebarOpen ? (
                          <span>{item.name}</span>
                        ) : (
                          /* Tooltip untuk collapsed state */
                          <div className="absolute right-full mr-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-md border">
                            {item.name}
                          </div>
                        )}
                      </Link>
                    )
                  })
                }
              </div>

              {/* User Profile Section - Bottom */}
              <div className={`relative ${isSidebarOpen ? 'mx-3 mb-3' : 'px-2'}`}>
                {/* Profile dropdown untuk expanded state */}
                {isSidebarOpen && isProfileDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 bg-card shadow-lg border border-border rounded-t-lg mb-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left px-4 py-3 rounded-t-lg hover:bg-accent/50" 
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Keluar dari Akun
                    </Button>
                  </div>
                )}
                
                {/* Profile dropdown untuk collapsed state */}
                {!isSidebarOpen && isProfileDropdownOpen && (
                  <div className="absolute right-full mr-2 bottom-2 bg-card shadow-lg border border-border rounded-lg z-50 min-w-48">
                    <div className="p-3 border-b">
                      <div className="text-sm font-medium">{user.email.split('@')[0]}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left px-3 py-2 rounded-none hover:bg-accent/50" 
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Keluar dari Akun
                    </Button>
                  </div>
                )}

                {/* Profile Button */}
                <Button
                  variant="ghost"
                  onClick={toggleProfileDropdown}
                  className={`w-full hover:bg-accent/50 rounded-lg transition-all duration-300 group relative ${
                    isSidebarOpen 
                      ? 'px-4 py-3 justify-between text-left h-auto' 
                      : 'p-3 justify-center'
                  }`}
                >
                  {isSidebarOpen ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      {/* Tooltip untuk collapsed profile */}
                      <div className="absolute right-full mr-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-md border">
                        {user.email.split('@')[0]}
                      </div>
                    </>
                  )}
                </Button>
              </div>
            </aside>
          </>
        )}
      </div>

      {/* Footer - Sticky at bottom */}
      <footer className="border-t bg-card mt-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-muted-foreground">
            © 2025 Adata. Made With ♥ For RKS A.
          </div>
        </div>
      </footer>
    </div>
  )
}