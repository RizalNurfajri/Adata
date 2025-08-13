// MaterialForm.tsx - Versi yang diperbaiki

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { 
  uploadToStorage, 
  deleteFromStorage, 
  extractFilePathFromUrl, 
  renameFileInStorage,
  getValidFileUrl,
  validateAndFixUrl
} from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { Loader2, Eye, ExternalLink } from 'lucide-react'

interface MaterialFormProps {
  isEdit?: boolean
  materialId?: string
}

export default function MaterialForm({ isEdit = false, materialId }: MaterialFormProps) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [originalLink, setOriginalLink] = useState<string>('')
  const [validatedLink, setValidatedLink] = useState<string>('')
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
        setLoading(true)
        try {
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

          const originalUrl = data.link || ''
          setOriginalLink(originalUrl)
          
          // Validasi dan perbaiki URL jika perlu
          if (originalUrl) {
            const validUrl = await getValidFileUrl(originalUrl)
            setValidatedLink(validUrl || originalUrl)
          }

          setFormData({
            title: data.judul,
            description: data.deskripsi ?? '',
            subject: data.matkul,
            semester: `Semester ${data.semester}`,
            type: data.tipe,
            link: validatedLink || originalUrl,
          })
        } catch (error) {
          console.error('Error fetching material:', error)
          toast({
            title: 'Error',
            description: 'Gagal memuat data materi',
            variant: 'destructive',
          })
        } finally {
          setLoading(false)
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
    
    // Validasi file
    if (selectedFile) {
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (selectedFile.size > maxSize) {
        toast({
          title: 'File terlalu besar',
          description: 'Ukuran file maksimal 50MB',
          variant: 'destructive',
        })
        e.target.value = '' // Reset input
        setFile(null)
        return
      }
      
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint'
      ]
      
      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.toLowerCase().endsWith('.pka')) {
        toast({
          title: 'Format file tidak didukung',
          description: 'Hanya file PDF, DOC, DOCX, PPT, PPTX, dan PKA yang diizinkan',
          variant: 'destructive',
        })
        e.target.value = '' // Reset input
        setFile(null)
        return
      }
    }
  }

  const deleteOldFile = async (fileUrl: string): Promise<boolean> => {
    if (!fileUrl) return true

    try {
      const deleted = await deleteFromStorage(fileUrl)
      if (deleted) {
        console.log('Old file deleted successfully')
        return true
      } else {
        console.warn('Failed to delete old file, but continuing...')
        return false
      }
    } catch (error) {
      console.error('Error deleting old file:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validasi form
      if (!formData.title.trim() || !formData.subject.trim()) {
        throw new Error('Judul dan mata kuliah harus diisi')
      }

      // Cek duplikasi judul (hanya untuk create, bukan edit)
      if (!isEdit) {
        const { data: existing, error: checkError } = await supabase
          .from('materials')
          .select('judul')
          .eq('judul', formData.title.trim())
          .maybeSingle()

        if (checkError) throw checkError
        if (existing) {
          toast({
            title: 'Judul sudah ada',
            description: 'Materi dengan judul ini sudah ditambahkan sebelumnya.',
            variant: 'destructive',
          })
          return
        }
      }

      let uploadedLink = validatedLink || formData.link

      if (file) {
        // Kasus: Upload file baru
        console.log('Uploading new file...', file.name)
        const url = await uploadToStorage(file, formData.subject, formData.type)
        if (!url) {
          throw new Error('Gagal upload file. Pastikan file tidak corrupt dan coba lagi.')
        }
        
        console.log('File uploaded successfully:', url)
        uploadedLink = url

        // Hapus file lama jika ini adalah edit dan ada file lama
        if (isEdit && originalLink && originalLink !== uploadedLink) {
          await deleteOldFile(originalLink)
        }
      } else if (isEdit && originalLink) {
        // Kasus: Edit tanpa upload file baru, tapi cek apakah struktur folder perlu diubah
        const currentFileName = originalLink.split('/').pop() || ''
        const currentFilePath = extractFilePathFromUrl(originalLink)
        
        if (currentFilePath && currentFileName) {
          // Sanitasi nama mata kuliah dan tipe untuk folder yang diharapkan
          const sanitizedMatkul = formData.subject
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, '') 
            .replace(/\s+/g, '-') 
            .trim()

          const sanitizedTipe = formData.type.toLowerCase()
          
          // Path yang diharapkan berdasarkan data form saat ini
          const expectedPath = `${sanitizedMatkul}/${sanitizedTipe}/${currentFileName}`
          
          // Jika struktur folder tidak sesuai, pindahkan file
          if (currentFilePath !== expectedPath) {
            console.log('Moving file to correct folder structure...')
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
              console.warn('Gagal memindahkan file ke struktur folder baru, menggunakan link lama')
              // Pastikan link yang digunakan valid
              const validUrl = await getValidFileUrl(originalLink)
              uploadedLink = validUrl || originalLink
            }
          } else {
            // Pastikan link yang ada masih valid
            const validUrl = await getValidFileUrl(originalLink)
            uploadedLink = validUrl || originalLink
          }
        }
      } else if (!isEdit && !file) {
        throw new Error('File harus diupload untuk materi baru')
      }

      // Pastikan ada link yang valid sebelum menyimpan ke database
      if (!uploadedLink) {
        throw new Error('Tidak ada file yang valid untuk disimpan')
      }

      const materialData = {
        judul: formData.title.trim(),
        deskripsi: formData.description.trim() || null,
        matkul: formData.subject.trim(),
        semester: parseInt(formData.semester.split(' ')[1]),
        tipe: formData.type,
        link: uploadedLink
      }

      if (isEdit && materialId) {
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', materialId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('materials')
          .insert([materialData])

        if (error) throw error
      }

      toast({
        title: 'Sukses',
        description: isEdit ? 'Materi berhasil diperbarui' : 'Materi berhasil ditambahkan',
      })

      navigate('/admin/dashboard')
    } catch (err: any) {
      console.error('Error in handleSubmit:', err)
      toast({
        title: 'Error',
        description: err.message || 'Terjadi kesalahan saat memproses data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewFile = () => {
    const linkToPreview = validatedLink || formData.link
    if (linkToPreview) {
      window.open(linkToPreview, '_blank')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-background p-6 rounded-lg border max-w-xl mx-auto">
      <h2 className="text-xl font-semibold">{isEdit ? 'Edit Materi' : 'Tambah Materi Baru'}</h2>

      <div>
        <Label>Judul Materi</Label>
        <Input 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          placeholder="Masukkan judul materi" 
          required 
          disabled={loading}
        />
      </div>

      <div>
        <Label>Deskripsi</Label>
        <Textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          placeholder="Masukkan deskripsi materi (opsional)" 
          disabled={loading}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label>Mata Kuliah</Label>
          <Input 
            name="subject" 
            value={formData.subject} 
            onChange={handleChange} 
            placeholder="Contoh: Jaringan Komputer" 
            required 
            disabled={loading}
          />
        </div>
        <div className="w-40">
          <Label>Semester</Label>
          <Select 
            value={formData.semester} 
            onValueChange={(value) => handleSelect('semester', value)}
            disabled={loading}
          >
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
        <Select 
          value={formData.type} 
          onValueChange={(value) => handleSelect('type', value)}
          disabled={loading}
        >
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
          {isEdit && (validatedLink || originalLink) && (
            <span className="block text-xs text-muted-foreground mt-1">
              File saat ini akan diganti jika Anda upload file baru
            </span>
          )}
        </Label>
        <Input 
          type="file" 
          accept=".pdf,.pka,.doc,.docx,.ppt,.pptx" 
          onChange={handleFileChange}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Format yang didukung: PDF, PKA, DOC, DOCX, PPT, PPTX (Maksimal 50MB)
        </p>
        
        {/* Preview existing file */}
        {isEdit && (validatedLink || originalLink) && (
          <div className="mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreviewFile}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <Eye className="h-4 w-4" />
              Preview File Saat Ini
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
          {isEdit ? 'Simpan Perubahan' : 'Tambah Materi'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/admin/dashboard')}
          disabled={loading}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}