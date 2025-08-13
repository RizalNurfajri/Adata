import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { uploadToStorage, deleteFromStorage, deleteFromStorageAlternative, extractFilePathFromUrl, renameFileInStorage, validatePdfUrl } from '@/lib/utils'
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

        // Validasi URL PDF jika ada
        let validatedLink = data.link || ''
        if (validatedLink) {
          const isValid = await validatePdfUrl(validatedLink)
          if (!isValid) {
            console.warn('Invalid PDF URL detected:', validatedLink)
            toast({
              title: 'Peringatan',
              description: 'Link file PDF mungkin tidak valid. Silakan upload file baru.',
              variant: 'destructive',
            })
          }
        }

        setOriginalLink(validatedLink)
        setFormData({
          title: data.judul,
          description: data.deskripsi ?? '',
          subject: data.matkul,
          semester: `Semester ${data.semester}`,
          type: data.tipe,
          link: validatedLink,
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

    // Validasi file
    if (selectedFile) {
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (selectedFile.size > maxSize) {
        toast({
          title: 'File terlalu besar',
          description: 'Ukuran file maksimal adalah 10MB',
          variant: 'destructive',
        })
        e.target.value = '' // Reset input
        setFile(null)
        return
      }

      // Validasi tipe file
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.pka')) {
        toast({
          title: 'Tipe file tidak didukung',
          description: 'Hanya file PDF, PKA, DOC, DOCX, PPT, PPTX yang diperbolehkan',
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

    console.log('Attempting to delete old file:', fileUrl)

    let deleted = await deleteFromStorage(fileUrl)

    if (!deleted) {
      console.log('First delete method failed, trying alternative method')
      deleted = await deleteFromStorageAlternative(fileUrl)
    }

    if (deleted) {
      console.log('Successfully deleted old file')
    } else {
      console.error('Failed to delete old file with all methods')
    }

    return deleted
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validasi data form
      if (!formData.title.trim()) {
        throw new Error('Judul materi harus diisi')
      }

      if (!formData.subject.trim()) {
        throw new Error('Mata kuliah harus diisi')
      }

      if (!isEdit && !file) {
        throw new Error('File harus diupload untuk materi baru')
      }

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
        console.log('Uploading new file:', file.name)
        // Kasus: Upload file baru
        // Pass mata kuliah dan tipe ke fungsi upload untuk struktur folder
        const url = await uploadToStorage(file, formData.subject, formData.type)
        if (!url) throw new Error('Gagal upload file. Silakan coba lagi.')
        
        console.log('File uploaded successfully:', url)
        uploadedLink = url

        // Validasi URL yang baru diupload
        const isValidUrl = await validatePdfUrl(uploadedLink)
        if (!isValidUrl) {
          throw new Error('File berhasil diupload tetapi URL tidak valid. Silakan coba lagi.')
        }

        // Hapus file lama jika ada dan berbeda
        if (isEdit && originalLink && originalLink !== uploadedLink) {
          console.log('Deleting old file since new file was uploaded')
          const deleted = await deleteOldFile(originalLink)
          if (!deleted) {
            console.warn('Warning: Could not delete old file, but continuing with update')
            toast({
              title: 'Peringatan',
              description: 'File baru berhasil diupload, tetapi file lama mungkin masih tersisa',
            })
          }
        }
      } else if (isEdit && originalLink) {
        console.log('No new file uploaded, checking if file structure needs to be updated')
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
          
          console.log('Current path:', currentFilePath)
          console.log('Expected path:', expectedPath)
          
          // Jika struktur folder tidak sesuai, pindahkan file
          if (currentFilePath !== expectedPath) {
            console.log('File structure needs to be updated, moving file')
            const renamedUrl = await renameFileInStorage(
              originalLink, 
              currentFileName, 
              formData.subject, 
              formData.type
            )
            
            if (renamedUrl) {
              // Validasi URL yang baru
              const isValidUrl = await validatePdfUrl(renamedUrl)
              if (isValidUrl) {
                uploadedLink = renamedUrl
                toast({
                  title: 'Info',
                  description: 'File berhasil dipindahkan ke struktur folder yang benar',
                })
              } else {
                console.warn('Renamed file URL is invalid, keeping original')
              }
            } else {
              // Jika gagal rename, tetap gunakan link lama
              console.warn('Gagal memindahkan file ke struktur folder baru, menggunakan link lama')
            }
          }
        }
      }

      // Final validation sebelum menyimpan ke database
      if (uploadedLink) {
        const isValidFinalUrl = await validatePdfUrl(uploadedLink)
        if (!isValidFinalUrl) {
          throw new Error('URL file tidak valid. Silakan upload ulang file.')
        }
      }

      const materialData = {
        judul: formData.title.trim(),
        deskripsi: formData.description.trim() || null,
        matkul: formData.subject.trim(),
        semester: parseInt(formData.semester.split(' ')[1]),
        tipe: formData.type,
        link: uploadedLink || null
      }

      if (isEdit && materialId) {
        console.log('Updating existing material:', materialData)
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', materialId)

        if (error) throw error
      } else {
        console.log('Creating new material:', materialData)
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
        <Input 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          placeholder="Masukkan judul materi" 
          required 
          maxLength={200}
        />
      </div>

      <div>
        <Label>Deskripsi</Label>
        <Textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          placeholder="Masukkan deskripsi materi (opsional)"
          maxLength={500}
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
            maxLength={100}
          />
        </div>
        <div className="w-40">
          <Label>Semester</Label>
          <Select value={formData.semester} onValueChange={(value) => handleSelect('semester', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih semester" />
            </SelectTrigger>