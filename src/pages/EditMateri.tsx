import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import MaterialForm from '@/components/MaterialForm'

export default function EditMateri() {
  const { id } = useParams()

  return (
    <AuthGuard requireAuth requireAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali ke Admin
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Materi</h1>
            <p className="text-muted-foreground">
              Perbarui informasi materi kuliah
            </p>
          </div>
        </div>

        {/* Form */}
        <MaterialForm materialId={id} isEdit />
      </div>
    </AuthGuard>
  )
}