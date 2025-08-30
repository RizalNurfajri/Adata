import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Book, ChevronRight } from 'lucide-react'

interface MatkulCardProps {
  matkul: string
  semester: number
  teoriCount: number
  praktikumCount: number
}

export default function MatkulCard({ matkul, semester, teoriCount, praktikumCount }: MatkulCardProps) {
  return (
    <Link to={`/semester/${semester}/${encodeURIComponent(matkul)}`} className="block group">
      <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group-hover:border-primary/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <Book className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{matkul}</CardTitle>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Badge variant="secondary" className="text-xs">
              Teori: {teoriCount}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Praktikum: {praktikumCount}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}