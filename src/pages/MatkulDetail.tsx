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
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header Section */}
      <div className="mb-8">
        <Button asChild variant="outline" size="sm" className="mb-6">
          <Link to={`/semester/${semester}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Link>
        </Button>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{matkul}</h1>
          <p className="text-muted-foreground text-lg">
            Semester {semester}
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="mb-8">
        <TabSwitcher semester={semester.toString()} matkul={matkul} />
      </div>

      {/* Stats Overview */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-medium mb-2">Ringkasan Materi</h3>
            <p className="text-muted-foreground">
              Overview dari semua materi yang tersedia
            </p>
          </div>
          
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Memuat...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-lg mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-1">{stats.totalMaterials}</div>
                <div className="text-sm text-muted-foreground">Total Materi</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-blue-500 mb-1">{stats.teoriCount}</div>
                <div className="text-sm text-muted-foreground">Materi Teori</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Laptop className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-500 mb-1">{stats.praktikumCount}</div>
                <div className="text-sm text-muted-foreground">Materi Praktikum</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="group hover:shadow-lg transition-all duration-200 h-full">
          <CardContent className="p-8 h-full">
            <Link 
              to={`/semester/${semester}/${encodeURIComponent(matkul)}/Teori`}
              className="flex flex-col h-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BookOpen className="h-7 w-7 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Materi Teori</h3>
                  <Badge variant="secondary" className="text-xs">
                    {stats.teoriCount} materi tersedia
                  </Badge>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6 flex-1">
                Akses semua materi teori untuk memahami konsep-konsep fundamental dalam mata kuliah ini. 
                Mulai dari dasar hingga materi lanjutan.
              </p>
              
              <div className="flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all">
                <span>Mulai Belajar</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-200 h-full">
          <CardContent className="p-8 h-full">
            <Link 
              to={`/semester/${semester}/${encodeURIComponent(matkul)}/Praktikum`}
              className="flex flex-col h-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Laptop className="h-7 w-7 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Materi Praktikum</h3>
                  <Badge variant="outline" className="text-xs">
                    {stats.praktikumCount} materi tersedia
                  </Badge>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6 flex-1">
                Praktikkan pengetahuan Anda dengan materi hands-on. 
                Latihan dan implementasi untuk mengasah kemampuan praktis.
              </p>
              
              <div className="flex items-center text-primary font-medium group-hover:gap-3 gap-2 transition-all">
                <span>Mulai Praktik</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Butuh Bantuan?</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Jika Anda kesulitan menemukan materi atau memiliki pertanyaan, 
              jangan ragu untuk mencari bantuan dari dosen atau asisten.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}