import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import TabSwitcher from '@/components/TabSwitcher'
import MaterialCard from '@/components/MaterialCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, FileText, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Material {
  id: string
  judul: string
  deskripsi: string | null
  matkul: string
  semester: number
  tipe: 'Teori' | 'Praktikum'
  link: string | null
  created_at: string
}

export default function MaterialList() {
  const { id: semesterParam, matkul: matkulParam, tipe } = useParams()
  const semester = parseInt(semesterParam || '1')
  const matkul = decodeURIComponent(matkulParam || '')
  const { profile } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMaterials()
  }, [semester, matkul, tipe])

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('semester', semester)
        .eq('matkul', matkul)
        .eq('tipe', tipe)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMaterials(data as Material[] || [])
    } catch (error) {
      console.error('Error loading materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMaterialDeleted = () => {
    loadMaterials() // Reload materials after deletion
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
              Semester {semester} - Materi {tipe}
            </p>
          </div>
        </div>

        {profile?.role === 'admin' && (
          <Button asChild>
            <Link to="/tambah">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Materi
            </Link>
          </Button>
        )}
      </div>

      {/* Tab Switcher */}
      <TabSwitcher 
        semester={semester.toString()} 
        matkul={matkul} 
        currentTipe={tipe}
      />

      {/* Materials Grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="p-6">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : materials.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Belum Ada Materi {tipe}</h3>
              <p className="text-muted-foreground mb-6">
                Belum ada materi {tipe.toLowerCase()} yang tersedia untuk {matkul}.
              </p>
              {profile?.role === 'admin' && (
                <Button asChild>
                  <Link to="/tambah">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Materi Pertama
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onDeleted={handleMaterialDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}