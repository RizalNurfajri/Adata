import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

// ✅ Utility: Merge class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ Upload file PDF ke Supabase Storage dan return public URL
export async function uploadToStorage(file: File): Promise<string | null> {
  const fileName = file.name // gunakan nama asli file
  const filePath = `pdf/${fileName}` // simpan di folder `pdf/`

  const uploadResult = await supabase.storage
    .from('materi-pdf')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true, // true agar file dengan nama sama bisa diganti
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
