import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ChevronRight } from 'lucide-react'

interface SemesterCardProps {
  semester: number
  materialCount: number
}

export default function SemesterCard({ semester, materialCount }: SemesterCardProps) {
  return (
    <Link to={`/semester/${semester}`} className="block group">
      <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group-hover:border-primary/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Semester {semester}</CardTitle>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {materialCount} mata kuliah tersedia
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}