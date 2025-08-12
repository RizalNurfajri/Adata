import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Edit, Trash2, Users, BookOpen, FileText, Search } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import MaterialCard from '@/components/MaterialCard'

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

export default function AdminDashboard() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalUsers: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false })

      if (materialsError) throw materialsError

      // Load stats
      const { count: totalMaterials } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })

      let totalUsers = 0;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (profileData?.role === 'admin') {
        const { count: countUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        totalUsers = countUsers || 0;
      }

      setMaterials(materialsData as Material[] || [])
      setStats({
        totalMaterials: totalMaterials || 0,
        totalUsers: totalUsers || 0
      })
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMaterialDeleted = () => {
    loadData() // Reload data after deletion
  }

  // Filter materials based on search query
  const filteredMaterials = materials.filter(material =>
    material.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.matkul.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (material.deskripsi && material.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())) ||
    material.tipe.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.semester.toString().includes(searchQuery)
  )

  return (
    <AuthGuard requireAuth requireAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Kelola materi dan sistem
          </p>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMaterials}</div>
              <p className="text-xs text-muted-foreground">
                Materi dalam sistem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Pengguna terdaftar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Materials Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Kelola Materi</CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Cari materi, mata kuliah, atau tipe..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Memuat...</p>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                {searchQuery ? (
                  <p className="text-muted-foreground mb-4">
                    Tidak ada materi yang sesuai dengan pencarian "{searchQuery}"
                  </p>
                ) : (
                  <p className="text-muted-foreground mb-4">Belum ada materi yang ditambahkan</p>
                )}
              </div>
            ) : (
              <>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Menampilkan {filteredMaterials.length} dari {materials.length} materi
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMaterials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      onDeleted={handleMaterialDeleted}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}