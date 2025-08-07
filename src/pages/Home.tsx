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
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="flex justify-center mb-6">
          <GraduationCap className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Materi Bersama</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Website sederhana untuk mengakses materi kuliah dengan mudah
        </p>
      </div>

      {/* Semesters Section */}
      <div>
        <div className="flex items-center space-x-2 mb-6">
          <BookOpen className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Pilih Semester</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
        ) : semesters.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Belum Ada Materi</h3>
              <p className="text-muted-foreground">
                Belum ada materi yang tersedia. Admin dapat menambahkan materi baru.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {semesters.map((semesterData) => (
              <SemesterCard
                key={semesterData.semester}
                semester={semesterData.semester}
                materialCount={semesterData.materialCount}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Cara Menggunakan</h3>
            <p className="text-muted-foreground">
              Pilih semester yang diinginkan, kemudian pilih mata kuliah untuk mengakses materi teori dan praktikum
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}