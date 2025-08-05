import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import TabSwitcher from '@/components/TabSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Laptop, Search, Calendar, Code } from 'lucide-react'

interface Material {
  id: string
  judul: string
  deskripsi?: string
  tanggal: string
  tipe: string
  semester: number
  matkul: string
}

export default function MateriPraktikum() {
  const { id: semesterParam, matkul: matkulParam } = useParams()
  const semester = parseInt(semesterParam || '1')
  const matkul = decodeURIComponent(matkulParam || '')
  const [materials, setMaterials] = useState<Material[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMaterials()
  }, [semester, matkul])

  useEffect(() => {
    filterMaterials()
  }, [materials, searchQuery])

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('semester', semester)
        .eq('matkul', matkul)
        .eq('tipe', 'Praktikum')
        .order('tanggal', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMaterials = () => {
    if (!searchQuery.trim()) {
      setFilteredMaterials(materials)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = materials.filter(material =>
      material.judul.toLowerCase().includes(query) ||
      material.deskripsi?.toLowerCase().includes(query)
    )
    setFilteredMaterials(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link to={`/semester/${semester}/${encodeURIComponent(matkul)}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{matkul}</h1>
            <p className="text-muted-foreground">
              Semester {semester} - Materi Praktikum
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <TabSwitcher semester={semester.toString()} matkul={matkul} />

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Cari materi praktikum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Materials List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Memuat materi...
              </div>
            </CardContent>
          </Card>
        ) : filteredMaterials.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Laptop className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada materi praktikum'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `Tidak ditemukan materi dengan kata kunci "${searchQuery}"`
                    : 'Materi praktikum untuk mata kuliah ini belum tersedia'
                  }
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery('')}
                    className="mt-4"
                  >
                    Hapus pencarian
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {searchQuery && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Ditemukan {filteredMaterials.length} materi untuk "{searchQuery}"
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                >
                  Hapus pencarian
                </Button>
              </div>
            )}
            
            <div className="grid gap-4">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Code className="h-4 w-4 text-green-500" />
                          <h3 className="font-medium">{material.judul}</h3>
                          <Badge variant="outline">Praktikum</Badge>
                        </div>
                        
                        {material.deskripsi && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {material.deskripsi}
                          </p>
                        )}
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(material.tanggal)}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Button size="sm">
                          Lihat Detail
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}