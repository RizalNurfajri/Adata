import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { uploadToStorage, deleteFromStorage, deleteFromStorageAlternative, extractFilePathFromUrl, renameFileInStorage } from '@/lib/utils'
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
        // Kasus: Upload file baru
        // Pass mata kuliah dan tipe ke fungsi upload untuk struktur folder
        const url = await uploadToStorage(file, formData.subject, formData.type)
        if (!url) throw new Error('Gagal upload file PDF')
        uploadedLink = url

        if (isEdit && originalLink && originalLink !== uploadedLink) {
          await deleteOldFile(originalLink)
        }
      } else if (isEdit && originalLink) {
        // Kasus: Edit tanpa upload file baru, tapi cek apakah struktur folder perlu diubah
        const currentFileName = originalLink.split('/').pop() || ''
        const currentFilePath = extractFilePathFromUrl(originalLink)
        
        if (currentFilePath) {
          // Sanitasi nama mata kuliah dan tipe untuk folder yang diharapkan
          const sanitizedMatkul = formData.subject
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, '') // Hapus karakter khusus
            .replace(/\s+/g, '-') // Ganti spasi dengan dash
            .trim()

          const sanitizedTipe = formData.type.toLowerCase()
          
          // Path yang diharapkan berdasarkan data form saat ini
          const expectedPath = `${sanitizedMatkul}/${sanitizedTipe}/${currentFileName}`
          
          // Jika struktur folder tidak sesuai, pindahkan file
          if (currentFilePath !== expectedPath) {
            const renamedUrl = await renameFileInStorage(
              originalLink, 
              currentFileName, 
              formData.subject, 
              formData.type
            )
            
            if (renamedUrl) {
              uploadedLink = renamedUrl
              toast({
                title: 'Info',
                description: 'File berhasil dipindahkan ke struktur folder yang benar',
              })
            } else {
              // Jika gagal rename, tetap gunakan link lama
              console.warn('Gagal memindahkan file ke struktur folder baru, menggunakan link lama')
            }
          }
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-background p-6 rounded-lg border w-full max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold break-words">{isEdit ? 'Edit Materi' : 'Tambah Materi Baru'}</h2>

      <div>
        <Label>Judul Materi</Label>
        <Input 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          placeholder="Masukkan judul materi" 
          required 
          className="w-full"
        />
      </div>

      <div>
        <Label>Deskripsi</Label>
        <Textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          placeholder="Masukkan deskripsi materi (opsional)"
          className="w-full min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Label>Mata Kuliah</Label>
          <Input 
            name="subject" 
            value={formData.subject} 
            onChange={handleChange} 
            placeholder="Contoh: Jaringan Komputer" 
            required 
            className="w-full"
          />
        </div>
        <div>
          <Label>Semester</Label>
          <Select value={formData.semester} onValueChange={(value) => handleSelect('semester', value)}>
            <SelectTrigger className="w-full">
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
          <SelectTrigger className="w-full max-w-xs">
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
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Format yang didukung: PDF, PKA, DOC, DOCX, PPT, PPTX
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        <Button type="submit" disabled={loading} className="order-2 sm:order-1">
          {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          {isEdit ? 'Simpan Perubahan' : 'Tambah Materi'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/admin/dashboard')}
          className="order-1 sm:order-2"
        >
          Batal
        </Button>
      </div>
    </form>
  )
}