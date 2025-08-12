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
  const [stats, setStats] = useState({ totalMaterials: 0, totalUsers: 0 })
  const { user } = useAuth()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Ambil semua materi
        const { count: materialsCount, error: materialsError } = await supabase
          .from('materials')
          .select('*', { count: 'exact', head: true })

        if (materialsError) throw materialsError

        // Ambil semua user dari tabel 'users' TANPA filter UID
        const { count: usersCount, error: usersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        if (usersError) throw usersError

        setStats({
          totalMaterials: materialsCount ?? 0,
          totalUsers: usersCount ?? 0
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }

    const fetchMaterials = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setMaterials(data || [])
      } catch (err) {
        console.error('Error fetching materials:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    fetchMaterials()
  }, [])

  const filteredMaterials = materials.filter(
    (material) =>
      material.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.matkul.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AuthGuard>
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Materi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMaterials}</div>
              <p className="text-xs text-muted-foreground">Materi dalam sistem</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Pengguna terdaftar</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Kelola Materi</h2>
          <Link to="/admin/materials/add">
            <Button>Tambah Materi</Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Cari materi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Search className="text-muted-foreground" />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredMaterials.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : (
          <p>Tidak ada materi ditemukan.</p>
        )}
      </div>
    </AuthGuard>
  )
}
