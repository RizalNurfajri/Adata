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

// --- Tambahan: nama tab tetap untuk mencegah tab dobel
const VIEWER_WINDOW_NAME = 'adata_pdf_viewer'

export default memo(function MaterialCard({ material, onDeleted }: MaterialCardProps) {
  const { profile } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isViewerLoading, setIsViewerLoading] = useState(false)

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

  // --- Perbaikan besar: pakai 1 tab bernama tetap + hilangkan fallback open _blank kedua
  const handleViewClick = useCallback(async (url: string) => {
    if (isViewerLoading) return
    setIsViewerLoading(true)
    try {
      toast({ title: 'Memuat PDF...', description: 'Silakan tunggu sebentar sampai PDF dimuat' })

      // Buka/ambil tab bernama tetap lebih dulu (ini tidak bikin tab kedua).
      // Jika tab sudah ada, akan dipakai ulang; kalau belum, dibuat baru.
      const viewerWin = window.open('about:blank', VIEWER_WINDOW_NAME, 'noopener,noreferrer')
      if (!viewerWin) {
        // Popup diblokir => hentikan di sini (JANGAN open tab lain sebagai fallback).
        throw new Error('Popup diblokir browser')
      }
      // Optional: kasih judul sementara biar tidak blank
      try { viewerWin.document.title = 'Memuat dokumen…' } catch {}

      // Preload HEAD untuk pastikan file ada
      const headOk = await fetch(url, { method: 'HEAD' }).then(r => r.ok).catch(() => false)
      if (!headOk) throw new Error('File tidak dapat diakses')

      // Arahkan ke PDF.js viewer
      const viewerUrl = getPdfJsViewerUrl(url)
      viewerWin.location.href = viewerUrl

      // Setelah 1s, kalau masih about:blank (kasus tertentu), paksa fallback ke Google Docs di tab yang sama
      setTimeout(() => {
        try {
          if (!viewerWin.closed && viewerWin.location.href === 'about:blank') {
            viewerWin.location.href = getGoogleDocsViewerUrl(url)
          }
        } catch {
          // Cross-origin = viewer kemungkinan sudah berhasil load; abaikan
        }
      }, 1000)
    } catch (error: any) {
      console.error('View error:', error)
      let msg = 'Gagal membuka file'
      if (String(error?.message || '').includes('tidak dapat diakses')) {
        msg = 'File tidak dapat diakses atau sudah tidak tersedia'
      } else if (String(error?.message || '').includes('Popup diblokir')) {
        msg = 'Popup diblokir browser. Mohon izinkan popup untuk situs ini'
      }
      toast({ title: 'Error', description: msg, variant: 'destructive' })
      // Penting: TIDAK ada window.open(url, '_blank') di sini agar tidak memicu tab kedua.
    } finally {
      setIsViewerLoading(false)
    }
  }, [isViewerLoading])

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
        headers: { 'Cache-Control': 'no-cache', 'Accept': 'application/octet-stream,*/*' },
        mode: 'cors',
        credentials: 'omit'
      })
      clearTimeout(timeoutId)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const contentLength = response.headers.get('Content-Length')
      const fileSize = contentLength ? parseInt(contentLength) : null
      const blob = await response.blob()
      if (blob.size === 0) throw new Error('File kosong atau tidak dapat didownload')
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'PDF files', accept: { 'application/pdf': ['.pdf'] } }]
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
        description: `File "${filename}" berhasil didownload${fileSize ? ` (${(fileSize / (1024 * 1024)).toFixed(2)} MB)` : ''}`,
      })
    } catch (error: any) {
      console.error('Download error:', error)
      let errorMessage = 'Gagal mendownload file'
      if (error.name === 'AbortError') errorMessage = 'Download timeout - file terlalu besar atau koneksi lambat'
      else if (error.message?.includes('HTTP error')) errorMessage = 'File tidak dapat diakses atau sudah tidak tersedia'
      else if (error.message?.includes('Failed to fetch')) errorMessage = 'Masalah koneksi internet'
      toast({ title: 'Download Gagal', description: errorMessage, variant: 'destructive' })
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
      setTimeout(() => { if (preconnectLink.parentNode) document.head.removeChild(preconnectLink) }, 1000)
    }
  }, [isDownloading])

  const downloadFallback = useCallback((blob: Blob, filename: string) => {
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
  }, [])

  const getFilename = useCallback((url: string, title: string) => {
    try {
      const urlParts = url.split('/')
      const rawFilename = urlParts[urlParts.length - 1]
      if (rawFilename && rawFilename.includes('.')) return decodeURIComponent(rawFilename)
      const sanitizedTitle = title
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\.+$/, '')
        .trim()
        .substring(0, 100)
      return `${sanitizedTitle || 'document'}.pdf`
    } catch {
      return `${title.substring(0, 50).replace(/[<>:"/\\|?*]/g, '') || 'document'}.pdf`
    }
  }, [])

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

  const getPdfJsViewerUrl = useCallback((link: string) => {
    const encodedUrl = encodeURIComponent(link)
    return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}`
  }, [])

  const getGoogleDocsViewerUrl = useCallback((link: string) => {
    const encodedUrl = encodeURIComponent(link)
    return `https://docs.google.com/gview?url=${encodedUrl}&embedded=true`
  }, [])

  const getViewerUrl = useCallback((link: string) => {
    return getPdfJsViewerUrl(link)
  }, [])

  return (
    <Card className="transition-all duration-200 hover:shadow-md will-change-transform flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-2 line-clamp-none sm:line-clamp-2 break-words break-all">
              {material.judul}
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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

      <CardContent className="flex-1 flex flex-col justify-between">
        {material.deskripsi && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
            {material.deskripsi}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2 justify-end sm:flex-nowrap">
          {material.link && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleViewClick(material.link!)}
                disabled={isViewerLoading}
                className="flex items-center shrink-0"
              >
                {isViewerLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-1" />
                )}
                {isViewerLoading ? 'Loading...' : 'Lihat'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(material.link!, getFilename(material.link!, material.judul))}
                disabled={isDownloading}
                className="flex items-center shrink-0"
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
              <Button asChild variant="outline" size="sm" className="shrink-0">
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
                className="shrink-0"
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
