import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import MatkulCard from '@/components/MatkulCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, BookOpen } from 'lucide-react'

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

      // Group by matkul and count tipe
      const matkulMap = new Map<string, { teori: number, praktikum: number }>()
      
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        ) : matkuls.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Belum Ada Mata Kuliah</h3>
              <p className="text-muted-foreground">
                Belum ada mata kuliah yang tersedia untuk semester {semester}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matkuls.map((matkulData) => (
              <MatkulCard
                key={matkulData.matkul}
                matkul={matkulData.matkul}
                semester={semester}
                teoriCount={matkulData.teoriCount}
                praktikumCount={matkulData.praktikumCount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}