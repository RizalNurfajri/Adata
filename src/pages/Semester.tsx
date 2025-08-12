import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import MatkulCard from '@/components/MatkulCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, BookOpen, Search } from 'lucide-react'

interface MatkulData {
  matkul: string
  teoriCount: number
  praktikumCount: number
}

export default function Semester() {
  const { id: semesterParam } = useParams()
  const semester = parseInt(semesterParam || '1')
  const [matkuls, setMatkuls] = useState<MatkulData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadMatkuls()
  }, [semester])

  const loadMatkuls = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('matkul, tipe')
        .eq('semester', semester)

      if (error) throw error

      const matkulMap = new Map<string, { teori: number; praktikum: number }>()

      data?.forEach(item => {
        if (!matkulMap.has(item.matkul)) {
          matkulMap.set(item.matkul, { teori: 0, praktikum: 0 })
        }

        const counts = matkulMap.get(item.matkul)!
        if (item.tipe === 'Teori') {
          counts.teori++
        } else if (item.tipe === 'Praktikum') {
          counts.praktikum++
        }
      })

      const matkulData: MatkulData[] = Array.from(matkulMap.entries())
        .map(([matkul, counts]) => ({
          matkul,
          teoriCount: counts.teori,
          praktikumCount: counts.praktikum
        }))
        .sort((a, b) => a.matkul.localeCompare(b.matkul))

      setMatkuls(matkulData)
    } catch (error) {
      console.error('Error loading mata kuliah:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMatkuls = matkuls.filter(matkul =>
    matkul.matkul.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Semester {semester}</h1>
            <p className="text-muted-foreground">
              Pilih mata kuliah untuk mengakses materi
            </p>
          </div>
        </div>
        
        {/* Search Input - Same style as AdminDashboard */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Cari mata kuliah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Mata Kuliah Grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMatkuls.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Tidak Ditemukan</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? `Tidak ada mata kuliah yang cocok dengan "${searchTerm}"`
                  : `Belum ada mata kuliah untuk semester ${semester}.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {searchTerm && (
              <p className="text-sm text-muted-foreground mb-4">
                Menampilkan {filteredMatkuls.length} dari {matkuls.length} mata kuliah
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMatkuls.map((matkulData) => (
                <MatkulCard
                  key={matkulData.matkul}
                  matkul={matkulData.matkul}
                  semester={semester}
                  teoriCount={matkulData.teoriCount}
                  praktikumCount={matkulData.praktikumCount}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}