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
  const [fetchLoading, setFetchLoading] = useState(false)
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
        setFetchLoading(true)
        
        try {
          const { data, error } = await supabase
            .from('materials')
            .select('*')
            .eq('id', materialId)
            .single()

          if (error) {
            console.error('Error fetching material:', error)
            toast({
              title: 'Error',
              description: 'Gagal memuat data materi: ' + error.message,
              variant: 'destructive',
            })
            return
          }

          if (!data) {
            toast({
              title: 'Error',
              description: 'Data materi tidak ditemukan',
              variant: 'destructive',
            })
            return
          }

          console.log('Fetched material data:', data)

          setOriginalLink(data.link || '')
          setFormData({
            title: data.judul || '',
            description: data.deskripsi || '',
            subject: data.matkul || '',
            semester: `Semester ${data.semester || 1}`,
            type: data.tipe || 'Teori',
            link: data.link || '',
          })
        } catch (err) {
          console.error('Unexpected error:', err)
          toast({
            title: 'Error',
            description: 'Terjadi kesalahan tidak terduga',
            variant: 'destructive',
          })
        } finally {
          setFetchLoading(false)
        }
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

      // Dalam mode edit, gunakan originalLink sebagai default jika tidak ada file baru
      let uploadedLink = isEdit ? originalLink : formData.link

      if (file) {
        // Pass mata kuliah dan tipe ke fungsi upload untuk struktur folder
        const url = await uploadToStorage(file, formData.subject, formData.type)
        if (!url) throw new Error('Gagal upload file PDF')
        uploadedLink = url

        // Hapus file lama hanya jika berhasil upload file baru dan linknya berbeda
        if (isEdit && originalLink && originalLink !== uploadedLink) {
          await deleteOldFile(originalLink)
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

  // Show loading while fetching data in edit mode
  if (isEdit && fetchLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto h-8 w-8 mb-2" />
          <p className="text-muted-foreground">Memuat data materi...</p>
        </div>
      </div>
    )
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
        </Label>
        
        {/* Tampilkan file yang sudah ada dalam mode edit */}
        {isEdit && originalLink && (
          <div className="mb-3 p-3 bg-muted/50 rounded-md border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">File saat ini:</p>
                <p className="text-sm text-muted-foreground break-all">
                  {originalLink.split('/').pop() || 'File tersimpan'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(originalLink, '_blank')}
              >
                Lihat File
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              File ini akan diganti jika Anda upload file baru
            </p>
          </div>
        )}
        
        <Input 
          type="file" 
          accept=".pdf,.pka,.doc,.docx,.ppt,.pptx" 
          onChange={handleFileChange}
          required={!isEdit && !originalLink}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Format yang didukung: PDF, PKA, DOC, DOCX, PPT, PPTX
        </p>
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