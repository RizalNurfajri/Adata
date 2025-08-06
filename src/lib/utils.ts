import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

// ✅ Utility: Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ Upload file PDF ke Supabase Storage dan ambil public URL
export async function uploadToStorage(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from('materi-pdf')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Upload error:', uploadError.message)
    return null
  }

  // Ambil public URL
  const { data: urlData, error: urlError } = supabase.storage
    .from('materi-pdf')
    .getPublicUrl(filePath)

  if (urlError) {
    console.error('URL generation error:', urlError.message)
    return null
  }

  return urlData?.publicUrl ?? null
}

// ✅ Ambil role user dari session Supabase
export async function getUserRole(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) return null

  const role = session.user.user_metadata?.role
  return role || null
}
