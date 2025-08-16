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
  
  return (
    <div className="mb-6">
      <Tabs value={currentTipe || 'Teori'} className="w-full">
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