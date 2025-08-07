import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

// ✅ Utility: Merge class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ Upload file PDF ke Supabase Storage dan return public URL
export async function uploadToStorage(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
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
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}

// ✅ Hapus file PDF dari Supabase Storage berdasarkan public URL
export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    console.log('Attempting to delete file:', publicUrl)
    
    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)

    // Contoh URL: https://project.supabase.co/storage/v1/object/public/materi-pdf/file.pdf
    const prefix = '/storage/v1/object/public/'
    const pathStartIndex = fullPath.indexOf(prefix)

    if (pathStartIndex === -1) {
      console.error('Public URL tidak valid (prefix not found):', publicUrl)
      return false
    }

    const fullStoragePath = fullPath.slice(pathStartIndex + prefix.length) // hasil: materi-pdf/file.pdf
    console.log('Full storage path:', fullStoragePath)
    
    const [bucketName, ...fileParts] = fullStoragePath.split('/')
    const filePath = fileParts.join('/')

    console.log('Bucket name:', bucketName)
    console.log('File path:', filePath)

    if (!filePath) {
      console.error('File path is empty')
      return false
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error.message)
      return false
    }

    console.log('File successfully deleted from storage')
    return true
  } catch (err) {
    console.error('Invalid public URL or delete failed:', err)
    return false
  }
}

// ✅ Alternative method untuk hapus file jika method utama gagal
export async function deleteFromStorageAlternative(publicUrl: string): Promise<boolean> {
  try {
    console.log('Using alternative delete method for:', publicUrl)
    
    // Method 2: Extract using regex pattern for materi-pdf bucket
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (!match) {
      console.error('Could not extract file path using regex from URL:', publicUrl)
      return false
    }
    
    const filePath = match[1]
    console.log('Extracted file path (alternative method):', filePath)

    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    if (error) {
      console.error('Alternative delete error:', error.message)
      return false
    }

    console.log('File successfully deleted using alternative method')
    return true
  } catch (error) {
    console.error('Alternative delete method failed:', error)
    return false
  }
}

// ✅ Get file path from public URL (utility function)
export function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)
    
    // Method 1: Using indexOf
    const prefix = '/storage/v1/object/public/'
    const pathStartIndex = fullPath.indexOf(prefix)
    
    if (pathStartIndex !== -1) {
      const fullStoragePath = fullPath.slice(pathStartIndex + prefix.length)
      const [bucketName, ...fileParts] = fullStoragePath.split('/')
      return fileParts.join('/')
    }
    
    // Method 2: Using regex as fallback
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    return match ? match[1] : null
  } catch (error) {
    console.error('Failed to extract file path:', error)
    return null
  }
}

// ✅ Ambil role user dari session Supabase
export async function getUserRole(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) return null

    const role = data.session.user.user_metadata?.role
    return role || null
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}