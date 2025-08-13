import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { uploadToStorage, deleteFromStorage, deleteFromStorageAlternative } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { Loader2 } from 'lucide-react'

interface MaterialFormProps {
  isEdit?: boolean
  materialId?: string
}

export default function MaterialForm({ isEdit = false, materialId }: MaterialFormProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [originalLink, setOriginalLink] = useState<string>('')
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

        setOriginalLink(data.link || '')
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

  const deleteOldFile = async (fileUrl: string): Promise<boolean> => {
    if (!fileUrl) return true

    let deleted = await deleteFromStorage(fileUrl)

    if (!deleted) {
      deleted = await deleteFromStorageAlternative(fileUrl)
    }

    return deleted
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validasi untuk mode edit: tidak boleh ada judul yang sama dengan material lain (kecuali dirinya sendiri)
      if (isEdit && materialId) {
        const { data: existing, error: checkError } = await supabase
          .from('materials')
          .select('judul, id')
          .eq('judul', formData.title)
          .neq('id', materialId) // Tambahkan kondisi ini untuk mengecualikan material yang sedang diedit
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 adalah error "no rows returned" yang normal jika tidak ada duplikat
          throw checkError
        }
        
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

      // Validasi untuk mode tambah baru
      if (!isEdit) {
        const { data: existing, error: checkError } = await supabase
          .from('materials')
          .select('judul')
          .eq('judul', formData.title)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 adalah error "no rows returned" yang normal jika tidak ada duplikat
          throw checkError
        }
        
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

      // Jika ada file baru yang diupload
      if (file) {
        // Pass mata kuliah dan tipe ke fungsi upload untuk struktur folder
        const url = await uploadToStorage(file, formData.subject, formData.type)
        if (!url) throw new Error('Gagal upload file PDF')
        uploadedLink = url

        // Hapus file lama jika sedang edit dan ada file lama
        if (isEdit && originalLink && originalLink !== uploadedLink) {
          await deleteOldFile(originalLink)
        }
      } else {
        // Jika mode edit dan tidak ada file baru, gunakan link yang sudah ada
        if (isEdit) {
          uploadedLink = originalLink
        }
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
        // Untuk mode tambah baru, file wajib diupload
        if (!uploadedLink) {
          toast({
            title: 'File wajib diupload',
            description: 'Silakan pilih file untuk diupload',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }

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

      <div>
        <Label>Judul Materi</Label>
        <Input name="title" value={formData.title} onChange={handleChange} placeholder="Masukkan judul materi" required />
      </div>

      <div>
        <Label>Deskripsi</Label>
        <Textarea name="description" value={formData.description} onChange={handleChange} placeholder="Masukkan deskripsi materi (opsional)" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Mata Kuliah</Label>
          <Input name="subject" value={formData.subject} onChange={handleChange} placeholder="Contoh: Jaringan Komputer" required />
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

      <div>
        <Label>
          {isEdit ? 'Upload File Baru (Opsional)' : 'Upload File'}
          {isEdit && originalLink && (
            <span className="block text-xs text-muted-foreground mt-1">
              File saat ini akan diganti jika Anda upload file baru
            </span>
          )}
        </Label>
        <Input 
          type="file" 
          accept=".pdf,.pka,.doc,.docx,.ppt,.pptx" 
          onChange={handleFileChange} 
        />
        <p className="text-xs text-muted-foreground mt-1">
          Format yang didukung: PDF, PKA, DOC, DOCX, PPT, PPTX
        </p>
        {isEdit && originalLink && (
          <p className="text-xs text-blue-600 mt-1">
            File saat ini: {originalLink.split('/').pop()}
          </p>
        )}
      </div>

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