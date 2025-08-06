import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Edit, Trash2, Calendar, Download } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'

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

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return

    setIsDeleting(true)
    try {
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
              {/* Tombol Lihat (preview PDF via Google Docs Viewer) */}
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

              {/* Tombol Download */}
              <Button asChild variant="outline" size="sm">
                <a
                  href={material.link}
                  download
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
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
                disabled={isDeleting}
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
}
