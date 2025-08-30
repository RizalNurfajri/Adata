import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import MatkulCard from '@/components/MatkulCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, BookOpen, Search, GraduationCap, Filter, Grid3X3, List } from 'lucide-react'

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterType, setFilterType] = useState<'all' | 'teori' | 'praktikum'>('all')

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

  const filteredMatkuls = matkuls.filter(matkul => {
    const matchesSearch = matkul.matkul.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = 
      filterType === 'all' || 
      (filterType === 'teori' && matkul.teoriCount > 0) ||
      (filterType === 'praktikum' && matkul.praktikumCount > 0)
    
    return matchesSearch && matchesFilter
  })

  const totalMaterials = matkuls.reduce((acc, curr) => acc + curr.teoriCount + curr.praktikumCount, 0)
  const totalTeori = matkuls.reduce((acc, curr) => acc + curr.teoriCount, 0)
  const totalPraktikum = matkuls.reduce((acc, curr) => acc + curr.praktikumCount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header with Stats */}
        <div className="relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl"></div>
          <div className="absolute inset-0 bg-black/10 rounded-3xl"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative p-8 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/20 border-white/20">
                    <Link to="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Kembali
                    </Link>
                  </Button>
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <GraduationCap className="h-8 w-8" />
                    <h1 className="text-4xl font-bold">Semester {semester}</h1>
                  </div>
                  <p className="text-blue-100 text-lg">
                    Jelajahi koleksi materi pembelajaran lengkap
                  </p>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                  <div className="text-2xl font-bold">{matkuls.length}</div>
                  <div className="text-xs text-blue-100">Mata Kuliah</div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                  <div className="text-2xl font-bold">{totalTeori}</div>
                  <div className="text-xs text-blue-100">Materi Teori</div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                  <div className="text-2xl font-bold">{totalPraktikum}</div>
                  <div className="text-xs text-blue-100">Praktikum</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Cari mata kuliah yang kamu butuhkan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl text-base"
                />
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="rounded-xl"
                >
                  Semua
                </Button>
                <Button
                  variant={filterType === 'teori' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('teori')}
                  className="rounded-xl"
                >
                  Teori
                </Button>
                <Button
                  variant={filterType === 'praktikum' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('praktikum')}
                  className="rounded-xl"
                >
                  Praktikum
                </Button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-lg h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-lg h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Info */}
        {searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 font-medium">
              Menampilkan <span className="font-bold">{filteredMatkuls.length}</span> dari <span className="font-bold">{matkuls.length}</span> mata kuliah
              {filterType !== 'all' && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                  {filterType === 'teori' ? 'Teori' : 'Praktikum'}
                </Badge>
              )}
            </p>
          </div>
        )}

        {/* Content Section */}
        <div>
          {loading ? (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="h-6 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded-full flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded-full flex-1"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMatkuls.length === 0 ? (
            <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {searchTerm ? 'Tidak Ditemukan' : 'Belum Ada Materi'}
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto">
                  {searchTerm
                    ? `Tidak ada mata kuliah yang cocok dengan "${searchTerm}". Coba kata kunci lain.`
                    : `Materi untuk semester ${semester} akan segera tersedia.`}
                </p>
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm('')}
                    className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Hapus Pencarian
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {filteredMatkuls.map((matkulData, index) => (
                <div
                  key={matkulData.matkul}
                  className="animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <MatkulCard
                    matkul={matkulData.matkul}
                    semester={semester}
                    teoriCount={matkulData.teoriCount}
                    praktikumCount={matkulData.praktikumCount}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}