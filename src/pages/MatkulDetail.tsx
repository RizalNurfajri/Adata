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

interface Material {
  id: number
  judul: string
  deskripsi: string
  tipe: 'Teori' | 'Praktikum'
  created_at: string
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
  const [activeTab, setActiveTab] = useState<'Overview' | 'Teori' | 'Praktikum'>('Overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [materials, setMaterials] = useState<Material[]>([])

  useEffect(() => {
    loadStats()
  }, [semester, matkul])

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
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

      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMaterials = materials.filter((item) => {
    const query = searchQuery.toLowerCase()
    const matchQuery =
      item.judul.toLowerCase().includes(query) ||
      item.deskripsi?.toLowerCase().includes(query)
    const matchTab =
      (activeTab === 'Teori' && item.tipe === 'Teori') ||
      (activeTab === 'Praktikum' && item.tipe === 'Praktikum')
    return matchQuery && matchTab
  })

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
      <TabSwitcher
        semester={semester.toString()}
        matkul={matkul}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
      />

      {/* Overview */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
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
                    {stats.teoriCount} materi tersedia
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
                    {stats.praktikumCount} materi tersedia
                  </Badge>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Teori / Praktikum Tab with Search */}
      {(activeTab === 'Teori' || activeTab === 'Praktikum') && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder={`Cari materi ${activeTab.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.length === 0 ? (
              <p className="text-muted-foreground">Tidak ada materi ditemukan.</p>
            ) : (
              filteredMaterials.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      <h4 className="font-medium">{item.judul}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.deskripsi}</p>
                    <div className="flex justify-between items-center text-sm">
                      <Badge variant={item.tipe === 'Teori' ? 'secondary' : 'outline'}>
                        {item.tipe}
                      </Badge>
                      <span>{new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
