import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import TabSwitcher from '@/components/TabSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Laptop, FileText } from 'lucide-react'

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
  const [isAdmin, setIsAdmin] = useState(false)
  const [userLoading, setUserLoading] = useState(true)

  useEffect(() => {
    checkUserRole()
    loadStats()
  }, [semester, matkul])

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check user role from profiles table or user metadata
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!error && profile) {
          setIsAdmin(profile.role === 'admin')
        }
        
        // Alternative: check from user metadata if role is stored there
        // setIsAdmin(user.user_metadata?.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    } finally {
      setUserLoading(false)
    }
  }

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

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Memuat...</div>
      </div>
    )
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

      {/* Tab Switcher - Only show for admin */}
      {isAdmin && <TabSwitcher semester={semester.toString()} matkul={matkul} />}

      {/* Content */}
      <div className="space-y-6">
        {/* Overview Content - Only for Admin */}
        {isAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto text-primary mb-4" />
                <h3 className="text-xl font-medium mb-2">Overview Mata Kuliah</h3>
                <p className="text-muted-foreground mb-6">
                  Ringkasan materi yang tersedia untuk {matkul}
                </p>
                
                {loading ? (
                  <div className="text-muted-foreground">Memuat...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.totalMaterials}</div>
                      <div className="text-sm text-muted-foreground">Total Materi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{stats.teoriCount}</div>
                      <div className="text-sm text-muted-foreground">Materi Teori</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{stats.praktikumCount}</div>
                      <div className="text-sm text-muted-foreground">Materi Praktikum</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Access - Always visible */}
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
                {isAdmin ? (
                  <Badge variant="secondary">
                    {stats.teoriCount} materi tersedia
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Materi Teori
                  </Badge>
                )}
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
                {isAdmin ? (
                  <Badge variant="outline">
                    {stats.praktikumCount} materi tersedia
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Materi Praktikum
                  </Badge>
                )}
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Non-admin message */}
        {!isAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Akses Materi</h3>
                <p className="text-muted-foreground">
                  Pilih jenis materi di atas untuk mengakses konten mata kuliah {matkul}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}