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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section with Enhanced Design */}
      <div className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-20 right-20 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-1/3 w-28 h-28 bg-indigo-200/30 rounded-full blur-3xl"></div>
        
        <div className="relative text-center py-20 px-4">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-xl opacity-30 scale-110"></div>
              <div className="relative bg-white p-6 rounded-full shadow-2xl border border-white/20">
                <GraduationCap className="h-20 w-20 text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
            Adata
          </h1>
          
          <div className="max-w-3xl mx-auto">
            <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-medium">
              Website sederhana untuk mengakses materi kuliah dengan mudah
            </p>
            
            {/* Animated underline */}
            <div className="mt-6 flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* Section Header with Enhanced Styling */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Pilih Semester
              </h2>
            </div>
            
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto"></div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="group">
                  <Card className="animate-pulse border-0 shadow-xl bg-white/70 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : semesters.length === 0 ? (
            <div className="flex justify-center">
              <Card className="w-full max-w-2xl border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-16">
                  <div className="mb-8">
                    <div className="inline-flex p-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full">
                      <BookOpen className="h-16 w-16 text-gray-400" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Belum Ada Materi</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Belum ada materi yang tersedia. Admin dapat menambahkan materi baru.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {semesters.map((semesterData, index) => (
                <div
                  key={semesterData.semester}
                  className="transform hover:scale-105 transition-all duration-300"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
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
        
        {/* Bottom decorative elements */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}