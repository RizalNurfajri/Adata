import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Users, Calendar } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'

interface Stats {
  totalMaterials: number
  totalSemesters: number
  totalMatkul: number
  recentMaterials: Array<{
    id: string
    judul: string
    matkul: string
    semester: number
    tipe: string
    created_at: string
  }>
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalMaterials: 0,
    totalSemesters: 0,
    totalMatkul: 0,
    recentMaterials: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Get total materials
      const { count: totalMaterials } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })

      // Get unique semesters
      const { data: semesterData } = await supabase
        .from('materials')
        .select('semester')

      const uniqueSemesters = new Set(semesterData?.map(item => item.semester) || [])

      // Get unique mata kuliah
      const { data: matkulData } = await supabase
        .from('materials')
        .select('matkul')

      const uniqueMatkul = new Set(matkulData?.map(item => item.matkul) || [])

      // Get recent materials
      const { data: recentMaterials } = await supabase
        .from('materials')
        .select('id, judul, matkul, semester, tipe, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalMaterials: totalMaterials || 0,
        totalSemesters: uniqueSemesters.size,
        totalMatkul: uniqueMatkul.size,
        recentMaterials: recentMaterials || []
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <AuthGuard requireAuth>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang, {user?.email}
            {profile?.role === 'admin' && (
              <Badge className="ml-2">Admin</Badge>
            )}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMaterials}</div>
              <p className="text-xs text-muted-foreground">
                Tersedia di platform
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Semester</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSemesters}</div>
              <p className="text-xs text-muted-foreground">
                Semester tersedia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mata Kuliah</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMatkul}</div>
              <p className="text-xs text-muted-foreground">
                Mata kuliah tersedia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Materials */}
        <Card>
          <CardHeader>
            <CardTitle>Materi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Memuat...</p>
            ) : stats.recentMaterials.length === 0 ? (
              <p className="text-muted-foreground">Belum ada materi tersedia</p>
            ) : (
              <div className="space-y-4">
                {stats.recentMaterials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{material.judul}</h4>
                      <p className="text-sm text-muted-foreground">
                        {material.matkul} - Semester {material.semester}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={material.tipe === 'Teori' ? 'default' : 'secondary'}>
                        {material.tipe}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(material.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}