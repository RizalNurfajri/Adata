import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import TabSwitcher from '@/components/TabSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Laptop } from 'lucide-react'

interface MatkulStats {
  teoriCount: number
  praktikumCount: number
  totalMaterials: number
}

export default function MatkulDetail() {
  const { id: semesterParam, matkul: matkulParam } = useParams()
  const semester = parseInt(semesterParam || '1')
  const matkul = decodeURIComponent(matkulParam || '')
  const [stats, setStats] = useState<MatkulStats>({
    teoriCount: 0,
    praktikumCount: 0,
    totalMaterials: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [semester, matkul])

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('tipe')
        .eq('semester', semester)
        .eq('matkul', matkul)

      if (error) throw error

      const teoriCount = data?.filter(item => item.tipe === 'Teori').length || 0
      const praktikumCount = data?.filter(item => item.tipe === 'Praktikum').length || 0

      setStats({
        teoriCount,
        praktikumCount,
        totalMaterials: teoriCount + praktikumCount
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link to={`/semester/${semester}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{matkul}</h1>
            <p className="text-muted-foreground">
              Semester {semester}
            </p>
          </div>
        </div>
      </div>



      {/* Tab Switcher */}
      <TabSwitcher semester={semester.toString()} matkul={matkul} />

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-200">
          <CardContent className="pt-6">
            <Link 
              to={`/semester/${semester}/${encodeURIComponent(matkul)}/Teori`}
              className="block text-center"
            >
              <BookOpen className="h-12 w-12 mx-auto text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-medium mb-2">Materi Teori</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Akses semua materi teori untuk mata kuliah ini
              </p>
              <Badge variant="secondary">
                {loading ? '...' : `${stats.teoriCount} materi tersedia`}
              </Badge>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200">
          <CardContent className="pt-6">
            <Link 
              to={`/semester/${semester}/${encodeURIComponent(matkul)}/Praktikum`}
              className="block text-center"
            >
              <Laptop className="h-12 w-12 mx-auto text-green-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-medium mb-2">Materi Praktikum</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Akses semua materi praktikum untuk mata kuliah ini
              </p>
              <Badge variant="outline">
                {loading ? '...' : `${stats.praktikumCount} materi tersedia`}
              </Badge>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}