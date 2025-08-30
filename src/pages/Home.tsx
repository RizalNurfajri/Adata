import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import SemesterCard from '@/components/SemesterCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, GraduationCap } from 'lucide-react'

interface SemesterData {
  semester: number
  materialCount: number
}

export default function Home() {
  const [semesters, setSemesters] = useState<SemesterData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSemesters()
  }, [])

  const loadSemesters = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('semester, matkul')

      if (error) throw error

      // Group by semester and count unique mata kuliah
      const semesterMap = new Map<number, Set<string>>()
      
      data?.forEach(item => {
        if (!semesterMap.has(item.semester)) {
          semesterMap.set(item.semester, new Set())
        }
        semesterMap.get(item.semester)?.add(item.matkul)
      })

      const semesterData: SemesterData[] = Array.from(semesterMap.entries())
        .map(([semester, matkulSet]) => ({
          semester,
          materialCount: matkulSet.size
        }))
        .sort((a, b) => a.semester - b.semester)

      setSemesters(semesterData)
    } catch (error) {
      console.error('Error loading semesters:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section - Centered Layout */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-primary/10">
          <GraduationCap className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-5xl font-bold mb-6">Adata</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Website sederhana untuk mengakses materi kuliah dengan mudah
        </p>
      </div>

      {/* Stats Overview (if we have data) */}
      {!loading && semesters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {semesters.length}
              </div>
              <p className="text-muted-foreground">Total Semester</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {semesters.reduce((acc, curr) => acc + curr.materialCount, 0)}
              </div>
              <p className="text-muted-foreground">Total Mata Kuliah</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {Math.round(semesters.reduce((acc, curr) => acc + curr.materialCount, 0) / semesters.length) || 0}
              </div>
              <p className="text-muted-foreground">Rata-rata per Semester</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Section */}
      <div className="space-y-8">
        {/* Section Header - Left Aligned with Better Spacing */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Pilih Semester</h2>
              <p className="text-muted-foreground">Akses materi berdasarkan semester</p>
            </div>
          </div>
        </div>

        {/* Content Area with Better Grid Layout */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-4">
                  <div className="h-6 bg-muted rounded-md"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded-md"></div>
                    <div className="h-4 bg-muted rounded-md w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : semesters.length === 0 ? (
          <div className="flex justify-center py-16">
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-12 pb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-muted">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Belum Ada Materi</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Belum ada materi yang tersedia. Admin dapat menambahkan materi baru.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Grid Layout with Better Responsive Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {semesters.map((semesterData) => (
                <SemesterCard
                  key={semesterData.semester}
                  semester={semesterData.semester}
                  materialCount={semesterData.materialCount}
                />
              ))}
            </div>

            {/* Optional: Quick Navigation for many semesters */}
            {semesters.length > 8 && (
              <div className="border-t pt-8">
                <h3 className="text-lg font-semibold mb-4">Navigasi Cepat</h3>
                <div className="flex flex-wrap gap-2">
                  {semesters.map((semesterData) => (
                    <button
                      key={`nav-${semesterData.semester}`}
                      className="px-3 py-1 text-sm rounded-full border hover:bg-muted transition-colors"
                      onClick={() => {
                        document.getElementById(`semester-${semesterData.semester}`)?.scrollIntoView({ 
                          behavior: 'smooth' 
                        })
                      }}
                    >
                      Semester {semesterData.semester}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}