import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

// ✅ Utility: Merge class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ Upload file PDF ke Supabase Storage dan return public URL
export async function uploadToStorage(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `pdf/${fileName}` // Folder "pdf" di dalam bucket "materi-pdf"

  const uploadResult = await supabase.storage
    .from('materi-pdf')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadResult.error) {
    console.error('Upload error:', uploadResult.error.message)
    return null
  }

  const urlResult = supabase.storage
    .from('materi-pdf')
    .getPublicUrl(filePath)

  return urlResult.data?.publicUrl ?? null
}

// ✅ Hapus file PDF dari Supabase Storage berdasarkan public URL
export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)

    // Contoh: /storage/v1/object/public/materi-pdf/pdf/file.pdf
    const prefix = '/storage/v1/object/public/'
    const pathStartIndex = fullPath.indexOf(prefix)

    if (pathStartIndex === -1) {
      console.error('Public URL tidak valid:', publicUrl)
      return false
    }

    const fullStoragePath = fullPath.slice(pathStartIndex + prefix.length) // hasil: materi-pdf/pdf/file.pdf
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
