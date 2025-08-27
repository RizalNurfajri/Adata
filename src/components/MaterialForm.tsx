import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { uploadToStorage, deleteFromStorageEnhanced, extractFilePathFromUrl } from '@/lib/utils'
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
  const [originalData, setOriginalData] = useState<any>(null)
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
        setOriginalData(data)
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
      // Check for duplicate title (except for current material when editing)
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

      let finalLink = originalLink

      // Handle file operations
      if (file) {
        // Case 1: New file uploaded
        console.log('Uploading new file...')
        const newUrl = await uploadToStorage(file, formData.subject, formData.type)
        if (!newUrl) {
          throw new Error('Gagal upload file')
        }
        
        finalLink = newUrl

        // Delete old file if this is an edit and we have an original link
        if (isEdit && originalLink) {
          console.log('Deleting old file:', originalLink)
          const deleted = await deleteFromStorageEnhanced(originalLink)
          if (!deleted) {
            console.warn('Failed to delete old file:', originalLink)
          }
        }
      } else if (isEdit && originalLink) {
        // Case 2: No new file, but check if we need to reorganize existing file
        const subjectChanged = originalData && originalData.matkul !== formData.subject
        const typeChanged = originalData && originalData.tipe !== formData.type
        
        if (subjectChanged || typeChanged) {
          console.log('Subject or type changed, need to reorganize file...')
          
          // Download the existing file
          const filePath = extractFilePathFromUrl(originalLink)
          if (filePath) {
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('materi-pdf')
              .download(filePath)
            
            if (downloadError || !fileData) {
              console.error('Failed to download existing file for reorganization:', downloadError)
              // Keep the original link if we can't reorganize
              finalLink = originalLink
            } else {
              // Create a File object from the downloaded data
              const fileName = filePath.split('/').pop() || 'file.pdf'
              const reorganizedFile = new File([fileData], fileName, { type: fileData.type })
              
              // Upload to new location
              const newUrl = await uploadToStorage(reorganizedFile, formData.subject, formData.type)
              if (newUrl) {
                finalLink = newUrl
                
                // Delete old file
                const deleted = await deleteFromStorageEnhanced(originalLink)
                if (!deleted) {
                  console.warn('Failed to delete old file during reorganization:', originalLink)
                }
              } else {
                console.error('Failed to upload file to new location')
                // Keep the original link if reorganization fails
                finalLink = originalLink
              }
            }
          }
        } else {
          // No changes to subject or type, keep existing link
          finalLink = originalLink
        }
      }

      // Update or insert the material
      if (isEdit && materialId) {
        const { error } = await supabase
          .from('materials')
          .update({
            judul: formData.title,
            deskripsi: formData.description,
            matkul: formData.subject,
            semester: parseInt(formData.semester.split(' ')[1]),
            tipe: formData.type,
            link: finalLink
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
            link: finalLink
          }])

        if (error) throw error
      }

      toast({
        title: 'Sukses',
        description: isEdit ? 'Materi berhasil diperbarui' : 'Materi berhasil ditambahkan',
      })

      navigate('/admin/dashboard')
    } catch (err: any) {
      console.error('Form submission error:', err)
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
          required={!isEdit} // Only required for new materials
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