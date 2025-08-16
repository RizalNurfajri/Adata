import { Link, useLocation } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TabSwitcherProps {
  semester: string
  matkul: string
  currentTipe?: string
}

export default function TabSwitcher({ semester, matkul, currentTipe }: TabSwitcherProps) {
  const location = useLocation()
  
  const baseUrl = `/semester/${semester}/${encodeURIComponent(matkul)}`
  
  // Determine the active tab - if no currentTipe is provided, default to 'Teori'
  const activeTab = currentTipe || 'Teori'
  
  return (
    <div className="mb-6">
      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Teori" asChild>
            <Link to={`${baseUrl}/Teori`}>
              Teori
            </Link>
          </TabsTrigger>
          <TabsTrigger value="Praktikum" asChild>
            <Link to={`${baseUrl}/Praktikum`}>
              Praktikum
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}