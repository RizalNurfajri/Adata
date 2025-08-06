import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

// Utility untuk menggabungkan class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Upload file PDF ke Supabase Storage
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

// Utility untuk merge class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Upload file PDF ke Supabase Storage dan return public URL
export async function uploadToStorage(file: File): Promise<string | null> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error } = await supabase.storage
    .from('materi-pdf')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error.message)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('materi-pdf')
    .getPublicUrl(filePath)

  return urlData?.publicUrl ?? null
}

// Ambil role user dari session Supabase
export async function getUserRole(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) return null

  const role = session.user.user_metadata?.role

  return role || null
}
