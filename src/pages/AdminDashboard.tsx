import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Users, BookOpen, FileText } from 'lucide-react'
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

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

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
            <CardTitle>Kelola Materi</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Memuat...</p>
            ) : materials.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Belum ada materi yang ditambahkan</p>
              </div>
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
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}