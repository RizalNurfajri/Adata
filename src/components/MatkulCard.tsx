import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Book, BookOpen, FlaskConical } from 'lucide-react'

interface MatkulCardProps {
  matkul: string
  semester: number
  teoriCount: number
  praktikumCount: number
}

export default function MatkulCard({ matkul, semester, teoriCount, praktikumCount }: MatkulCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Book className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{matkul}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Teori Button */}
        <Link 
          to={`/semester/${semester}/${encodeURIComponent(matkul)}/teori`}
          className={`block w-full ${teoriCount === 0 ? 'pointer-events-none opacity-50' : ''}`}
        >
          <div className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors group">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Teori</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {teoriCount}
            </Badge>
          </div>
        </Link>

        {/* Praktikum Button */}
        <Link 
          to={`/semester/${semester}/${encodeURIComponent(matkul)}/praktikum`}
          className={`block w-full ${praktikumCount === 0 ? 'pointer-events-none opacity-50' : ''}`}
        >
          <div className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors group">
            <div className="flex items-center space-x-2">
              <FlaskConical className="h-4 w-4 text-green-600" />
              <span className="font-medium">Praktikum</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {praktikumCount}
            </Badge>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}