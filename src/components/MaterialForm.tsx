import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { uploadToStorage } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react'

interface MaterialFormProps {
  isEdit?: boolean
  materialId?: string
}

export default function MaterialForm({ isEdit = false, materialId }: MaterialFormProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    semester: 'Semester 1',
    type: 'Teori',
    link: ''
  })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    const fetchMaterial = async () => {
      if (isEdit && materialId) {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .eq('id', materialId)
          .single()

        if (error || !data) {
          toast({
            title: 'Error',
            description: 'Gagal memuat data materi',
            variant: 'destructive',
          })
          return
        }

        setFormData({
          title: data.judul,
          description: data.deskripsi ?? '',
          subject: data.matkul,
          semester: `Semester ${data.semester}`,
          type: data.tipe,
          link: data.link ?? '',
        })
      }
    }

    fetchMaterial()
  }, [isEdit, materialId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelect = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!isEdit) {
        const { data: existing, error: checkError } = await supabase
          .from('materials')
          .select('judul')
          .eq('judul', formData.title)
          .maybeSingle()

        if (checkError) throw checkError
        if (existing) {
          toast({
            title: 'Judul sudah ada',
            description: 'Materi dengan judul ini sudah ditambahkan sebelumnya.',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
      }

      let uploadedLink = formData.link
      if (file) {
        const url = await uploadToStorage(file)
        if (!url) throw new Error('Gagal upload file PDF')
        uploadedLink = url
      }

      if (isEdit && materialId) {
        const { error } = await supabase
          .from('materials')
          .update({
            judul: formData.title,
            deskripsi: formData.description,
            matkul: formData.subject,
            semester: parseInt(formData.semester.split(' ')[1]),
            tipe: formData.type,
            link: uploadedLink
          })
          .eq('id', materialId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('materials')
          .insert([{
            judul: formData.title,
            deskripsi: formData.description,
            matkul: formData.subject,
            semester: parseInt(formData.semester.split(' ')[1]),
            tipe: formData.type,
            link: uploadedLink
          }])

        if (error) throw error
      }

      toast({
        title: 'Sukses',
        description: isEdit ? 'Materi berhasil diperbarui' : 'Materi berhasil ditambahkan',
      })

      navigate('/admin/dashboard')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Terjadi kesalahan saat memproses data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-background p-6 rounded-lg border max-w-xl mx-auto">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Materi' : 'Tambah Materi Baru'}</h2>

      {/* Judul */}
      <div>
        <Label>Judul Materi</Label>
        <Input name="title" value={formData.title} onChange={handleChange} placeholder="Masukkan judul materi" required />
      </div>

      {/* Deskripsi */}
      <div>
        <Label>Deskripsi</Label>
        <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Masukkan deskripsi materi (opsional)" />
      </div>

      {/* Mata Kuliah & Semester */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Mata Kuliah</Label>
          <Input name="subject" value={formData.subject} onChange={handleChange} placeholder="Contoh: Matematika Diskrit" required />
        </div>
        <div className="w-40">
          <Label>Semester</Label>
          <Select value={formData.semester} onValueChange={(value) => handleSelect('semester', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih semester" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 8 }).map((_, i) => (
                <SelectItem key={i} value={`Semester ${i + 1}`}>
                  Semester {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tipe */}
      <div>
        <Label>Tipe</Label>
        <Select value={formData.type} onValueChange={(value) => handleSelect('type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Teori">Teori</SelectItem>
            <SelectItem value="Praktikum">Praktikum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Upload PDF */}
      <div>
        <Label>Upload File PDF</Label>
        <Input type="file" accept=".pdf" onChange={handleFileChange} />
      </div>

      {/* Tombol */}
      <div className="flex gap-4 justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          {isEdit ? 'Simpan Perubahan' : 'Tambah Materi'}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')}>
          Batal
        </Button>
      </div>
    </form>
  )
}
