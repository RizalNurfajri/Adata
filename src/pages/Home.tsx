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
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center py-16 mb-16">
          <div className="flex justify-center mb-8">
            <div className="p-4 rounded-full shadow-lg border">
              <GraduationCap className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6">Adata</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Website sederhana untuk mengakses materi kuliah dengan mudah
          </p>
          <div className="mt-12 w-24 h-1 bg-primary/20 mx-auto rounded-full"></div>
        </div>

        {/* Semesters Section */}
        <div>
          <div className="flex items-center justify-center space-x-3 mb-12">
            <div className="p-2 rounded-lg border">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Pilih Semester</h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse shadow-md">
                  <CardHeader className="pb-4">
                    <div className="h-6 bg-muted rounded-lg"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded-lg mb-2"></div>
                    <div className="h-4 bg-muted rounded-lg w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : semesters.length === 0 ? (
            <div className="flex justify-center">
              <Card className="text-center py-16 px-12 max-w-lg shadow-lg">
                <CardContent className="space-y-6">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full border">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Belum Ada Materi</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Belum ada materi yang tersedia. Admin dapat menambahkan materi baru.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {semesters.map((semesterData) => (
                <div 
                  key={semesterData.semester} 
                  className="transform hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out"
                >
                  <SemesterCard
                    semester={semesterData.semester}
                    materialCount={semesterData.materialCount}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Spacing */}
        <div className="py-20"></div>
      </div>
    </div>
  )
}