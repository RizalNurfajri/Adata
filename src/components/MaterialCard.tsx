import { useState, useCallback, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Edit, Trash2, Calendar, Download, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { deleteFromStorageEnhanced } from '@/lib/utils'

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

export default memo(function MaterialCard({ material, onDeleted }: MaterialCardProps) {
  const { profile } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  // Memoize functions to prevent unnecessary re-renders
  const handleDelete = useCallback(async () => {
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
  }, [material.id, material.link, onDeleted])

  // Optimized download function with preconnect hint and better error handling
  const handleDownload = useCallback(async (fileUrl: string, filename: string) => {
    if (isDownloading) return // Prevent multiple downloads
    
    setIsDownloading(true)
    
    // Add preconnect hint for better performance
    const preconnectLink = document.createElement('link')
    preconnectLink.rel = 'preconnect'
    preconnectLink.href = new URL(fileUrl).origin
    document.head.appendChild(preconnectLink)
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      // Show loading toast
      toast({
        title: 'Memulai download...',
        description: `Mendownload ${filename}`,
      })

      // Fetch with timeout and optimized headers
      const response = await fetch(fileUrl, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/octet-stream,*/*',
        },
        mode: 'cors',
        credentials: 'omit'
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // Get file size if available
      const contentLength = response.headers.get('Content-Length')
      const fileSize = contentLength ? parseInt(contentLength) : null
      
      // Convert to blob with progress tracking
      const blob = await response.blob()
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('File kosong atau tidak dapat didownload')
      }
      
      // Create optimized download using modern APIs
      if ('showSaveFilePicker' in window) {
        // Use File System Access API if available (modern browsers)
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'PDF files',
              accept: { 'application/pdf': ['.pdf'] }
            }]
          })
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
        } catch (fsError) {
          // Fallback to traditional download
          downloadFallback(blob, filename)
        }
      } else {
        // Traditional download method
        downloadFallback(blob, filename)
      }
      
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
          window.open(fileUrl, '_blank', 'noopener,noreferrer')
          toast({
            title: 'Membuka di tab baru',
            description: 'Silakan download manual dari tab yang terbuka',
          })
        } catch {
          // Final fallback - copy to clipboard
          if (navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(fileUrl)
              toast({
                title: 'Link disalin',
                description: 'Link file telah disalin ke clipboard',
              })
            } catch {
              console.error('Failed to copy to clipboard')
            }
          }
        }
      }
    } finally {
      setIsDownloading(false)
      // Clean up preconnect link
      setTimeout(() => {
        if (preconnectLink.parentNode) {
          document.head.removeChild(preconnectLink)
        }
      }, 1000)
    }
  }, [isDownloading])

  // Helper function for traditional download
  const downloadFallback = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    
    // Set download attributes
    a.style.display = 'none'
    a.href = url
    a.download = filename
    a.target = '_blank' // Open in new tab as fallback
    
    // Append to body and trigger download
    document.body.appendChild(a)
    
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      a.click()
      
      // Cleanup with slight delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        if (document.body.contains(a)) {
          document.body.removeChild(a)
        }
      }, 100)
    })
  }, [])

  // Memoized filename extraction with better sanitization
  const getFilename = useCallback((url: string, title: string) => {
    try {
      const urlParts = url.split('/')
      const rawFilename = urlParts[urlParts.length - 1]
      
      if (rawFilename && rawFilename.includes('.')) {
        return decodeURIComponent(rawFilename)
      }
      
      // Sanitize title for filename with improved logic
      const sanitizedTitle = title
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid filename characters including control chars
        .replace(/\s+/g, ' ') // Normalize spaces
        .replace(/\.+$/, '') // Remove trailing dots
        .trim()
        .substring(0, 100) // Limit length
      
      return `${sanitizedTitle || 'document'}.pdf`
    } catch {
      return `${title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '') || 'document'}.pdf`
    }
  }, [])

  // Memoized date formatting
  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Tanggal tidak valid'
    }
  }, [])

  // Optimize Google Docs viewer URL
  const getViewerUrl = useCallback((link: string) => {
    const encodedUrl = encodeURIComponent(link)
    return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`
  }, [])

  return (
    <Card className="transition-all duration-200 hover:shadow-md will-change-transform">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            {/* Judul 2 baris rapi, tidak terpotong ellipsis */}
            <CardTitle className="text-lg mb-2 line-clamp-2 break-words">
              {material.judul}
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatDate(material.created_at)}</span>
            </div>
          </div>
          <Badge 
            variant={material.tipe === 'Teori' ? 'default' : 'secondary'}
            className="ml-2 flex-shrink-0"
          >
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

        {/* Tombol rapi & responsif: sejajar ke kanan, tetap wrap bila sempit */}
        <div className="flex flex-wrap gap-2 justify-end">
          {material.link && (
            <>
              <Button asChild variant="outline" size="sm">
                <a
                  href={getViewerUrl(material.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                  onMouseEnter={() => {
                    const prefetchLink = document.createElement('link')
                    prefetchLink.rel = 'prefetch'
                    prefetchLink.href = getViewerUrl(material.link!)
                    document.head.appendChild(prefetchLink)
                  }}
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
                <Link 
                  to={`/edit/${material.id}`}
                  onMouseEnter={() => {
                    const prefetchLink = document.createElement('link')
                    prefetchLink.rel = 'prefetch'
                    prefetchLink.href = `/edit/${material.id}`
                    document.head.appendChild(prefetchLink)
                  }}
                >
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
