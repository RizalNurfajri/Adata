import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Edit, Trash2, Calendar, Download, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { deleteFromStorageEnhanced, debugStorageContents } from '@/lib/utils'

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

interface MaterialCardProps {
  material: Material
  onDeleted?: () => void
}

export default function MaterialCard({ material, onDeleted }: MaterialCardProps) {
  const { profile } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return

    setIsDeleting(true)
    try {
      if (material.link) {
        const deleted = await deleteFromStorageEnhanced(material.link)

        if (!deleted) {
          toast({
            title: 'Peringatan',
            description: 'File berhasil dihapus dari database tetapi mungkin masih tersisa di storage. Periksa console untuk detail.',
            variant: 'destructive',
          })
        }
      }

      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', material.id)

      if (error) throw error

      toast({
        title: 'Berhasil',
        description: 'Materi berhasil dihapus',
      })

      onDeleted?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus materi',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDebugStorage = async () => {
    await debugStorageContents()
  }

  // Optimized download function with timeout and better error handling
  const handleDownload = async (fileUrl: string, filename: string) => {
    if (isDownloading) return // Prevent multiple downloads
    
    setIsDownloading(true)
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      // Show loading toast
      const loadingToast = toast({
        title: 'Memulai download...',
        description: `Mendownload ${filename}`,
      })

      // Fetch with timeout
      const response = await fetch(fileUrl, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Get file size if available
      const contentLength = response.headers.get('Content-Length')
      const fileSize = contentLength ? parseInt(contentLength) : null
      
      // Convert to blob
      const blob = await response.blob()
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('File kosong atau tidak dapat didownload')
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      
      // Set download attributes
      a.style.display = 'none'
      a.href = url
      a.download = filename
      a.target = '_blank' // Open in new tab as fallback
      
      // Append to body and trigger download
      document.body.appendChild(a)
      
      // Trigger download
      a.click()
      
      // Cleanup immediately after click
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
      
      // Success toast
      toast({
        title: 'Berhasil!',
        description: `File "${filename}" berhasil didownload${fileSize ? ` (${(fileSize / (1024 * 1024)).toFixed(2)} MB)` : ''}`,
      })
      
    } catch (error: any) {
      console.error('Download error:', error)
      
      let errorMessage = 'Gagal mendownload file'
      
      if (error.name === 'AbortError') {
        errorMessage = 'Download timeout - file terlalu besar atau koneksi lambat'
      } else if (error.message.includes('HTTP error')) {
        errorMessage = 'File tidak dapat diakses atau sudah tidak tersedia'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Masalah koneksi internet'
      }
      
      toast({
        title: 'Download Gagal',
        description: errorMessage,
        variant: 'destructive',
      })
      
      // Fallback - try opening in new tab
      if (fileUrl) {
        try {
          window.open(fileUrl, '_blank')
          toast({
            title: 'Membuka di tab baru',
            description: 'Silakan download manual dari tab yang terbuka',
          })
        } catch {
          // Final fallback - copy to clipboard
          if (navigator.clipboard) {
            navigator.clipboard.writeText(fileUrl)
            toast({
              title: 'Link disalin',
              description: 'Link file telah disalin ke clipboard',
            })
          }
        }
      }
    } finally {
      setIsDownloading(false)
    }
  }

  // Extract filename from URL or use title with better sanitization
  const getFilename = (url: string, title: string) => {
    try {
      const urlParts = url.split('/')
      const rawFilename = urlParts[urlParts.length - 1]
      
      if (rawFilename && rawFilename.includes('.')) {
        return decodeURIComponent(rawFilename)
      }
      
      // Sanitize title for filename
      const sanitizedTitle = title
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
        .substring(0, 100) // Limit length
      
      return `${sanitizedTitle}.pdf`
    } catch {
      return `${title.substring(0, 50)}.pdf`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{material.judul}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(material.created_at)}</span>
            </div>
          </div>
          <Badge variant={material.tipe === 'Teori' ? 'default' : 'secondary'}>
            {material.tipe}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {material.deskripsi && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {material.deskripsi}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {material.link && (
            <>
              <Button asChild variant="outline" size="sm">
                <a
                  href={`https://docs.google.com/gview?url=${encodeURIComponent(material.link)}&embedded=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Lihat
                </a>
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDownload(material.link!, getFilename(material.link!, material.judul))}
                disabled={isDownloading}
                className="flex items-center"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            </>
          )}

          {profile?.role === 'admin' && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to={`/edit/${material.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isDownloading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDebugStorage}
                className="text-xs"
                disabled={isDownloading}
              >
                Debug Storage
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}