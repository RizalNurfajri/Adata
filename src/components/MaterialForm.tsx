import { useState } from 'react'
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

export default function MaterialForm() {
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
      let uploadedLink = formData.link

      if (file) {
        const url = await uploadToStorage(file)
        if (!url) throw new Error('Gagal upload file PDF')
        uploadedLink = url
      }

      const { error } = await supabase.from('materials').insert([
        {
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          semester: formData.semester,
          type: formData.type,
          link: uploadedLink
        }
      ])

      if (error) throw error

      toast({
        title: 'Sukses',
        description: 'Materi berhasil ditambahkan',
      })

      navigate('/admin/dashboard')
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Terjadi kesalahan saat menambahkan materi',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-background p-6 rounded-lg border max-w-xl mx-auto">
      <h2 className="text-xl font-semibold">Tambah Materi Baru</h2>

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
        <p className="text-sm text-muted-foreground mt-1">Atau isi link manual di bawah jika tidak upload</p>
      </div>

      {/* Link PDF */}
      <div>
        <Label>Link PDF/Materi</Label>
        <Input name="link" value={formData.link} onChange={handleChange} placeholder="https://example.com/materi.pdf (opsional)" />
      </div>

      {/* Tombol */}
      <div className="flex gap-4 justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          Tambah Materi
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')}>
          Batal
        </Button>
      </div>
    </form>
  )
}
