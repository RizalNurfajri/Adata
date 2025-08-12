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

// Global download queue to prevent multiple simultaneous downloads
const downloadQueue = new Set<string>()

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

  // Super optimized download function
  const handleDownload = async (fileUrl: string, filename: string) => {
    // Prevent multiple downloads of same file
    if (downloadQueue.has(fileUrl)) {
      toast({
        title: 'Download sedang berjalan',
        description: 'File ini sedang didownload, mohon tunggu',
      })
      return
    }

    // Prevent multiple downloads from same card
    if (isDownloading) return

    setIsDownloading(true)
    downloadQueue.add(fileUrl)

    try {
      // Method 1: Direct download with link element (fastest)
      const directDownload = () => {
        const a = document.createElement('a')
        a.href = fileUrl
        a.download = filename
        a.style.display = 'none'
        a.target = '_blank'
        
        // Add to DOM, click, and remove immediately
        document.body.appendChild(a)
        a.click()
        
        // Immediate cleanup
        setTimeout(() => {
          if (document.body.contains(a)) {
            document.body.removeChild(a)
          }
        }, 100)

        return true
      }

      // Try direct download first (fastest method)
      if (directDownload()) {
        toast({
          title: 'Download dimulai',
          description: `Mengunduh ${filename}`,
        })
        return
      }

      // Method 2: Fetch with optimizations (fallback)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

      // Show immediate feedback
      toast({
        title: 'Memproses download...',
        description: filename,
      })

      const response = await fetch(fileUrl, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        // Don't wait for full response, start download immediately
        credentials: 'omit'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Stream download instead of waiting for full blob
      const reader = response.body?.getReader()
      const contentLength = response.headers.get('Content-Length')
      const chunks: Uint8Array[] = []
      let receivedLength = 0

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          if (value) {
            chunks.push(value)
            receivedLength += value.length
            
            // Show progress if content length is known
            if (contentLength) {
              const progress = (receivedLength / parseInt(contentLength)) * 100
              if (progress % 25 === 0) { // Update every 25%
                toast({
                  title: `Download ${Math.round(progress)}%`,
                  description: filename,
                })
              }
            }
          }
        }
      }

      // Create blob from chunks
      const blob = new Blob(chunks)
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('File kosong')
      }

      // Create download URL and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      
      a.href = url
      a.download = filename
      a.style.display = 'none'
      
      document.body.appendChild(a)
      a.click()
      
      // Quick cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        if (document.body.contains(a)) {
          document.body.removeChild(a)
        }
      }, 100)

      const fileSize = (blob.size / (1024 * 1024)).toFixed(2)
      toast({
        title: 'Download selesai!',
        description: `${filename} (${fileSize}MB)`,
      })

    } catch (error: any) {
      console.error('Download error:', error)

      let errorMessage = 'Gagal download file'
      
      if (error.name === 'AbortError') {
        errorMessage = 'Download timeout - coba lagi'
      } else if (error.message.includes('HTTP')) {
        errorMessage = 'File tidak dapat diakses'
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Masalah koneksi'
      }

      toast({
        title: 'Download gagal',
        description: errorMessage,
        variant: 'destructive',
      })

      // Ultimate fallback - open in new tab
      try {
        const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer')
        if (newWindow) {
          toast({
            title: 'Dibuka di tab baru',
            description: 'Download manual dari tab yang terbuka',
          })
        } else {
          // Final fallback - copy link
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(fileUrl)
            toast({
              title: 'Link disalin',
              description: 'Paste link di browser untuk download',
            })
          }
        }
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError)
      }

    } finally {
      setIsDownloading(false)
      downloadQueue.delete(fileUrl)
    }
  }

  // Optimized filename extraction
  const getFilename = (url: string, title: string) => {
    try {
      // Quick URL parsing
      const urlParts = url.split('/')
      const lastPart = urlParts[urlParts.length - 1]
      
      if (lastPart && lastPart.includes('.')) {
        return decodeURIComponent(lastPart).replace(/[<>:"/\\|?*]/g, '_')
      }
      
      // Sanitize title quickly
      const clean = title.replace(/[<>:"/\\|?*]/g, '_').trim().substring(0, 80)
      return `${clean}.pdf`
    } catch {
      return `materi_${Date.now()}.pdf`
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
                disabled={isDownloading || downloadQueue.has(material.link)}
                className="flex items-center min-w-[90px]"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    <span className="text-xs">Wait...</span>
                  </>
                ) : downloadQueue.has(material.link!) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    <span className="text-xs">Queue</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </>
                )}
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}