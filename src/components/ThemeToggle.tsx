import { Moon, Sun } from 'lucide-react'
import useDarkMode from '@/hooks/useDarkMode'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useDarkMode()

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-md hover:bg-muted transition"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}
