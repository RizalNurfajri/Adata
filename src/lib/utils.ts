import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

// ✅ Utility: Merge class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ Hapus file PDF dari Supabase Storage berdasarkan public URL
export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)

    // Contoh path: /storage/v1/object/public/materi-pdf/pdf/namafile.pdf
    const prefix = '/storage/v1/object/public/'
    const pathStartIndex = fullPath.indexOf(prefix)

    if (pathStartIndex === -1) {
      console.error('Public URL tidak valid:', publicUrl)
      return false
    }

    const fullStoragePath = fullPath.slice(pathStartIndex + prefix.length) // hasil: materi-pdf/pdf/namafile.pdf
    const [bucketName, ...fileParts] = fullStoragePath.split('/')
    const filePath = fileParts.join('/')

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error.message)
      return false
    }

    return true
  } catch (err) {
    console.error('Invalid public URL:', err)
    return false
  }
}

// ✅ Ambil role user dari session Supabase
export async function getUserRole(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) return null

  const role = data.session.user.user_metadata?.role
  return role || null
}
