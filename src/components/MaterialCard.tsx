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

  const handleDelete = useCallback(async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return
    setIsDeleting(true)
    try {
      if (material.link) {
        const deleted = await deleteFromStorageEnhanced(material.link)
        if (!deleted) {
          toast({
            title: 'Peringatan',
            description:
              'File berhasil dihapus dari database tetapi mungkin masih tersisa di storage. Periksa console untuk detail.',
            variant: 'destructive',
          })
        }
      }
      const { error } = await supabase.from('materials').delete().eq('id', material.id)
      if (error) throw error
      toast({ title: 'Berhasil', description: 'Materi berhasil dihapus' })
      onDeleted?.()
    } catch {
      toast({ title: 'Error', description: 'Gagal menghapus materi', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }, [material.id, material.link, onDeleted])

  const handleDownload = useCallback(async (fileUrl: string, filename: string) => {
    if (isDownloading) return
    setIsDownloading(true)

    const preconnectLink = document.createElement('link')
    preconnectLink.rel = 'preconnect'
    preconnectLink.href = new URL(fileUrl).origin
    document.head.appendChild(preconnectLink)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      toast({ title: 'Memulai download...', description: `Mendownload ${filename}` })

      const response = await fetch(fileUrl, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache', Accept: 'application/octet-stream,*/*' },
        mode: 'cors',
        credentials: 'omit',
      })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const blob = await response.blob()
      if (blob.size === 0) throw new Error('File kosong atau tidak dapat didownload')

      const downloadFallback = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = filename
        a.target = '_blank'
        document.body.appendChild(a)
        requestAnimationFrame(() => {
          a.click()
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
            if (document.body.contains(a)) document.body.removeChild(a)
          }, 100)
        })
      }

      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'PDF files', accept: { 'application/pdf': ['.pdf'] } }],
          })
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()
        } catch {
          downloadFallback(blob, filename)
        }
      } else {
        downloadFallback(blob, filename)
      }

      toast({
        title: 'Berhasil!',
        description: `File "${filename}" berhasil didownload`,
      })
    } catch (error: any) {
      console.error('Download error:', error)
      let msg = 'Gagal mendownload file'
      if (error.name === 'AbortError') msg = 'Download timeout - file terlalu besar atau koneksi lambat'
      else if (error.message?.includes('HTTP error')) msg = 'File tidak dapat diakses atau sudah tidak tersedia'
      else if (error.message?.includes('Failed to fetch')) msg = 'Masalah koneksi internet'

      toast({ title: 'Download Gagal', description: msg, variant: 'destructive' })

      if (fileUrl) {
        try {
          window.open(fileUrl, '_blank', 'noopener,noreferrer')
          toast({ title: 'Membuka di tab baru', description: 'Silakan download manual dari tab yang terbuka' })
        } catch {
          if (navigator.clipboard) {
            try {
              await navigator.clipboard.writeText(fileUrl)
              toast({ title: 'Link disalin', description: 'Link file telah disalin ke clipboard' })
            } catch {}
          }
        }
      }
    } finally {
      setIsDownloading(false)
      setTimeout(() => {
        if (preconnectLink.parentNode) document.head.removeChild(preconnectLink)
      }, 1000)
    }
  }, [isDownloading])

  const getFilename = useCallback((url: string, title: string) => {
    try {
      const parts = url.split('/')
      const last = parts[parts.length - 1]
      if (last && last.includes('.')) return decodeURIComponent(last)
      return `${title || 'document'}.pdf`
    } catch {
      return `${title.substring(0, 50) || 'document'}.pdf`
    }
  }, [])

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return 'Tanggal tidak valid'
    }
  }, [])

  const getViewerUrl = useCallback((link: string) => {
    const encoded = encodeURIComponent(link)
    return `https://docs.google.com/gview?url=${encoded}&embedded=true`
  }, [])

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md will-change-transform flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
          <div className="flex-1 min-w-0">
            <CardTitle
              title={material.judul}
              className="text-base sm:text-lg mb-2 sm:line-clamp-2 break-words hyphens-auto"
            >
              {material.judul}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatDate(material.created_at)}</span>
            </div>
          </div>

          <Badge
            variant={material.tipe === 'Teori' ? 'default' : 'secondary'}
            className="ml-0 sm:ml-2 self-start sm:self-auto flex-shrink-0"
          >
            {material.tipe}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {material.deskripsi && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 break-words">
            {material.deskripsi}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 gap-x-3 justify-between sm:justify-end">
          {material.link && (
            <>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full sm:w-auto shrink-0"
              >
                <a href={getViewerUrl(material.link)} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Lihat
                </a>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(material.link!, getFilename(material.link!, material.judul))}
                disabled={isDownloading}
                className="w-full sm:w-auto shrink-0"
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
              <Button asChild variant="outline" size="sm" className="w-full sm:w-auto shrink-0">
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
                className="w-full sm:w-auto shrink-0"
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
