import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import TabSwitcher from '@/components/TabSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Laptop, Search } from 'lucide-react'

interface MatkulStats {
  teoriCount: number
  praktikumCount: number
  totalMaterials: number
}

interface Material {
  id: string
  judul: string
  tipe: string
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
  const [materials, setMaterials] = useState<Material[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [semester, matkul])

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('id, judul, tipe')
        .eq('semester', semester)
        .eq('matkul', matkul)

      if (error) throw error

      const teoriCount = data?.filter(item => item.tipe === 'Teori').length || 0
      const praktikumCount = data?.filter(item => item.tipe === 'Praktikum').length || 0

      setMaterials(data || [])
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

  const filteredMaterials = materials.filter(m =>
    m.judul.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link to={`/semester/${semester}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{matkul}</h1>
            <p className="text-muted-foreground">Semester {semester}</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari judul materi..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 w-full rounded-md border bg-neutral-900 border-neutral-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#e94560]"
        />
      </div>

      {/* Tab Switcher */}
      <TabSwitcher semester={semester.toString()} matkul={matkul} />

      {/* Overview Content */}
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-medium mb-2">Overview Mata Kuliah</h3>
              <p className="text-muted-foreground mb-6">
                Ringkasan materi untuk <strong>{matkul}</strong>
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

        {/* Search Result (optional) */}
        {searchQuery && (
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Hasil pencarian untuk: <span className="text-[#e94560]">{searchQuery}</span>
            </h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((m) => (
                  <li key={m.id}>
                    {m.judul} <Badge className="ml-2" variant="outline">{m.tipe}</Badge>
                  </li>
                ))
              ) : (
                <li>Tidak ditemukan materi</li>
              )}
            </ul>
          </div>
        )}

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
    </div>
  )
}
