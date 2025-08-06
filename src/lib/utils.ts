import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

// ✅ Utility: Merge class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ Upload file PDF ke Supabase Storage dan return public URL (pakai timestamp)
export async function uploadToStorage(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

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

// ✅ Tambahan: Upload file pakai nama asli file
export async function uploadWithOriginalName(file: File): Promise<string | null> {
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const filePath = `pdf/${sanitizedFileName}`

  const uploadResult = await supabase.storage
    .from('materi-pdf')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // bisa replace jika nama file sama
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

// ✅ Ambil role user dari session Supabase
export async function getUserRole(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) return null

  const role = data.session.user.user_metadata?.role
  return role || null
}
