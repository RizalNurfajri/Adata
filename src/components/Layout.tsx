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
  BookOpen,
  Settings
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
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
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="Adata" className="h-6 w-6" />
                <span className="text-xl font-bold text-foreground">Adata</span>
              </Link>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="hidden sm:flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="text-muted-foreground">{user.email}</span>
                    {profile?.role === 'admin' && (
                      <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                        Admin
                      </span>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Keluar</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-card border-r min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground px-3 pb-2">
                Navigasi
              </h3>
              {navigationItems
                .filter(item => item.show)
                .map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })
              }
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeSidebar} />
            <aside className="fixed left-0 top-0 w-64 bg-card h-full shadow-lg">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img src="/logo.png" alt="Adata" className="h-6 w-6" />
                    <span className="text-xl font-bold">Adata</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={closeSidebar}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* User info on mobile */}
                {user && (
                  <div className="p-3 bg-accent rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{user.email}</span>
                    </div>
                    {profile?.role === 'admin' && (
                      <span className="inline-block mt-1 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                        Admin
                      </span>
                    )}
                  </div>
                )}
                
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-muted-foreground px-3 pb-2">
                    Navigasi
                  </h3>
                  {navigationItems
                    .filter(item => item.show)
                    .map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={closeSidebar}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive(item.path)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })
                  }
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-muted-foreground">
            © 2025 Adata. Made With ♥ By Rizal.
          </div>
        </div>
      </footer>
    </div>
  )
}