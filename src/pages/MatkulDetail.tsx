import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import TabSwitcher from '@/components/TabSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Laptop, FileText, BarChart3 } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button asChild variant="outline" size="sm" className="shadow-sm">
              <Link to={`/semester/${semester}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Link>
            </Button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border-0 p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Semester {semester}
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{matkul}</h1>
                <p className="text-slate-600 text-lg">
                  Semua materi pembelajaran dalam satu tempat
                </p>
              </div>
              
              {/* Stats Summary Card */}
              <div className="bg-slate-50 rounded-xl p-6 min-w-[280px]">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Ringkasan Materi</span>
                </div>
                {loading ? (
                  <div className="text-slate-500 text-sm">Memuat statistik...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.totalMaterials}</div>
                      <div className="text-xs text-slate-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{stats.teoriCount}</div>
                      <div className="text-xs text-slate-600">Teori</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{stats.praktikumCount}</div>
                      <div className="text-xs text-slate-600">Praktikum</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mb-8">
          <TabSwitcher semester={semester.toString()} matkul={matkul} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Materi Teori Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <Link 
                to={`/semester/${semester}/${encodeURIComponent(matkul)}/Teori`}
                className="block"
              >
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <BookOpen className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
                    <Badge className="bg-blue-400 hover:bg-blue-400 text-blue-50">
                      {stats.teoriCount} materi
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Materi Teori</h3>
                  <p className="text-blue-100 text-sm opacity-90">
                    Pelajari konsep-konsep fundamental dan teori
                  </p>
                </div>
                
                <div className="p-6 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Akses semua materi teori
                    </span>
                    <ArrowLeft className="h-4 w-4 text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Materi Praktikum Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <Link 
                to={`/semester/${semester}/${encodeURIComponent(matkul)}/Praktikum`}
                className="block"
              >
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Laptop className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
                    <Badge className="bg-green-400 hover:bg-green-400 text-green-50">
                      {stats.praktikumCount} materi
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Materi Praktikum</h3>
                  <p className="text-green-100 text-sm opacity-90">
                    Praktikkan ilmu dengan hands-on experience
                  </p>
                </div>
                
                <div className="p-6 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                      Akses semua materi praktikum
                    </span>
                    <ArrowLeft className="h-4 w-4 text-slate-400 rotate-180 group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Section */}
        <div className="mt-12">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center max-w-2xl mx-auto">
                <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-medium text-slate-900 mb-3">
                  Mulai Belajar
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6">
                  Pilih jenis materi yang ingin Anda pelajari. Materi teori untuk memahami konsep dasar, 
                  dan materi praktikum untuk mengasah kemampuan aplikatif Anda.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="shadow-sm">
                    <Link to={`/semester/${semester}/${encodeURIComponent(matkul)}/Teori`}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Mulai dengan Teori
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="shadow-sm">
                    <Link to={`/semester/${semester}/${encodeURIComponent(matkul)}/Praktikum`}>
                      <Laptop className="h-4 w-4 mr-2" />
                      Langsung ke Praktikum
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}