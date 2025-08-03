import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface Material {
  id?: string
  judul: string
  deskripsi: string
  matkul: string
  semester: number
  tipe: 'Teori' | 'Praktikum'
  link: string
}

interface MaterialFormProps {
  materialId?: string
  isEdit?: boolean
}

export default function MaterialForm({ materialId, isEdit = false }: MaterialFormProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Material>({
    judul: '',
    deskripsi: '',
    matkul: '',
    semester: 1,
    tipe: 'Teori',
    link: ''
  })

  // Load material data for editing
  useEffect(() => {
    if (isEdit && materialId) {
      loadMaterial()
    }
  }, [isEdit, materialId])

  const loadMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', materialId)
        .single()

      if (error) throw error

      setFormData({
        judul: data.judul,
        deskripsi: data.deskripsi || '',
        matkul: data.matkul,
        semester: data.semester,
        tipe: data.tipe as 'Teori' | 'Praktikum',
        link: data.link || ''
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data materi',
        variant: 'destructive',
      })
      navigate('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEdit && materialId) {
        const { error } = await supabase
          .from('materials')
          .update({
            judul: formData.judul,
            deskripsi: formData.deskripsi,
            matkul: formData.matkul,
            semester: formData.semester,
            tipe: formData.tipe,
            link: formData.link
          })
          .eq('id', materialId)

        if (error) throw error

        toast({
          title: 'Berhasil',
          description: 'Materi berhasil diperbarui',
        })
      } else {
        const { error } = await supabase
          .from('materials')
          .insert({
            judul: formData.judul,
            deskripsi: formData.deskripsi,
            matkul: formData.matkul,
            semester: formData.semester,
            tipe: formData.tipe,
            link: formData.link
          })

        if (error) throw error

        toast({
          title: 'Berhasil',
          description: 'Materi berhasil ditambahkan',
        })
      }

      navigate(`/semester/${formData.semester}/${encodeURIComponent(formData.matkul)}/${formData.tipe}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: isEdit ? 'Gagal memperbarui materi' : 'Gagal menambahkan materi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Material, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Materi' : 'Tambah Materi Baru'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="judul">Judul Materi</Label>
            <Input
              id="judul"
              type="text"
              value={formData.judul}
              onChange={(e) => handleInputChange('judul', e.target.value)}
              placeholder="Masukkan judul materi"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              value={formData.deskripsi}
              onChange={(e) => handleInputChange('deskripsi', e.target.value)}
              placeholder="Masukkan deskripsi materi (opsional)"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="matkul">Mata Kuliah</Label>
              <Input
                id="matkul"
                type="text"
                value={formData.matkul}
                onChange={(e) => handleInputChange('matkul', e.target.value)}
                placeholder="Contoh: Matematika Diskrit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Select
                value={formData.semester.toString()}
                onValueChange={(value) => handleInputChange('semester', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipe">Tipe</Label>
            <Select
              value={formData.tipe}
              onValueChange={(value) => handleInputChange('tipe', value as 'Teori' | 'Praktikum')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe materi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Teori">Teori</SelectItem>
                <SelectItem value="Praktikum">Praktikum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link PDF/Materi</Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => handleInputChange('link', e.target.value)}
              placeholder="https://example.com/materi.pdf (opsional)"
            />
          </div>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Perbarui Materi' : 'Tambah Materi'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}