import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  UserCircle
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsSidebarOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
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
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="Adata" className="h-6 w-6" />
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
                  {profile?.role === 'admin' && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse"></span>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
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
              className={`fixed right-0 top-0 w-full sm:w-96 md:w-80 bg-card h-full shadow-xl border-l transform transition-transform duration-300 ease-in-out ${
                isSidebarOpen 
                  ? 'translate-x-0' 
                  : 'translate-x-full'
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className={`text-lg font-semibold transition-all duration-500 ${
                    isSidebarOpen 
                      ? 'opacity-100 transform translate-x-0' 
                      : 'opacity-0 transform translate-x-4'
                  }`}>
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
                
                {/* User Profile Section */}
                <div className={`flex items-start space-x-3 transition-all duration-700 delay-100 ${
                  isSidebarOpen 
                    ? 'opacity-100 transform translate-x-0' 
                    : 'opacity-0 transform translate-x-8'
                }`}>
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110">
                      <UserCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {profile?.role === 'admin' ? (
                        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-primary text-primary-foreground transition-all duration-200 hover:scale-105">
                          <Settings className="h-3 w-3 mr-1" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground transition-all duration-200 hover:scale-105">
                          <User className="h-3 w-3 mr-1" />
                          User
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Section */}
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <h3 className={`text-sm font-medium text-muted-foreground uppercase tracking-wide transition-all duration-700 delay-200 ${
                    isSidebarOpen 
                      ? 'opacity-100 transform translate-x-0' 
                      : 'opacity-0 transform translate-x-8'
                  }`}>
                    Navigasi
                  </h3>
                  <div className="space-y-1">
                    {navigationItems
                      .filter(item => item.show)
                      .map((item, index) => {
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
                            } ${
                              isSidebarOpen 
                                ? 'opacity-100 transform translate-x-0' 
                                : 'opacity-0 transform translate-x-8'
                            }`}
                            style={{
                              transitionDelay: isSidebarOpen ? `${300 + (index * 100)}ms` : '0ms'
                            }}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </Link>
                        )
                      })
                    }
                  </div>
                </div>

                {/* Account Actions */}
                <div className={`space-y-3 pt-6 border-t transition-all duration-700 delay-500 ${
                  isSidebarOpen 
                    ? 'opacity-100 transform translate-x-0' 
                    : 'opacity-0 transform translate-x-8'
                }`}>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Akun
                  </h3>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left transition-all duration-200 hover:scale-[1.02] hover:translate-x-1" 
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Keluar dari Akun
                  </Button>
                </div>

                {/* App Info */}
                <div className={`pt-6 border-t transition-all duration-700 delay-600 ${
                  isSidebarOpen 
                    ? 'opacity-100 transform translate-x-0' 
                    : 'opacity-0 transform translate-x-8'
                }`}>
                  <div className="text-center text-xs text-muted-foreground">
                    <p>Adata v1.0</p>
                    <p className="mt-1">© 2025 Made with ♥ by Rizal</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Footer - only visible when sidebar is closed */}
      {!isSidebarOpen && (
        <footer className="border-t bg-card mt-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-muted-foreground">
              © 2025 Adata. Made With ♥ By Rizal.
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}