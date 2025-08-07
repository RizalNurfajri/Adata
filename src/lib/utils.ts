import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

// ✅ Utility: Merge class Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ✅ Upload file ke Supabase Storage dan return public URL
export async function uploadToStorage(file: File): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    console.log('Uploading file:', fileName, 'Extension:', fileExt)

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

    console.log('Upload successful, public URL:', urlResult.data?.publicUrl)
    return urlResult.data?.publicUrl ?? null
  } catch (error) {
    console.error('Upload error:', error)
    return null
  }
}

// ✅ Hapus file dari Supabase Storage berdasarkan public URL
export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    console.log('=== DELETE FROM STORAGE DEBUG ===')
    console.log('Original URL:', publicUrl)
    
    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)
    console.log('Full pathname:', fullPath)

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
    console.log('File path to delete:', filePath)
    console.log('File parts:', fileParts)

    if (!filePath) {
      console.error('File path is empty after extraction')
      return false
    }

    // Pastikan bucket name benar
    if (bucketName !== 'materi-pdf') {
      console.error('Bucket name mismatch. Expected: materi-pdf, Got:', bucketName)
      return false
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('Supabase delete error:', error)
      return false
    }

    console.log('✅ File successfully deleted from storage')
    console.log('=== END DELETE DEBUG ===')
    return true
  } catch (err) {
    console.error('Exception during delete:', err)
    console.log('=== END DELETE DEBUG (ERROR) ===')
    return false
  }
}

// ✅ Alternative method untuk hapus file jika method utama gagal
export async function deleteFromStorageAlternative(publicUrl: string): Promise<boolean> {
  try {
    console.log('=== ALTERNATIVE DELETE METHOD ===')
    console.log('Using alternative delete method for:', publicUrl)
    
    // Method 2: Extract using regex pattern for materi-pdf bucket
    // Handle both .pdf and .pka files
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (!match) {
      console.error('Could not extract file path using regex from URL:', publicUrl)
      return false
    }
    
    const filePath = match[1]
    console.log('Extracted file path (alternative method):', filePath)

    const { data: listResult, error: listError } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })

    if (listError) {
      console.error('Error listing files:', listError)
    } else {
      console.log('Files in storage:', listResult?.map(f => f.name))
      const fileExists = listResult?.some(f => f.name === filePath)
      console.log('File exists in storage:', fileExists)
    }

    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    if (error) {
      console.error('Alternative delete error:', error)
      return false
    }

    console.log('✅ File successfully deleted using alternative method')
    console.log('=== END ALTERNATIVE DELETE ===')
    return true
  } catch (error) {
    console.error('Alternative delete method failed:', error)
    console.log('=== END ALTERNATIVE DELETE (ERROR) ===')
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