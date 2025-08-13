// utils.ts - Versi yang diperbaiki

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fungsi untuk membuat nama file yang unique untuk menghindari konflik
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "")
  return `${nameWithoutExt}-${timestamp}-${random}.${extension}`
}

// Fungsi upload yang lebih robust
export async function uploadToStorage(file: File, matkul?: string, tipe?: string): Promise<string | null> {
  try {
    // Validasi file terlebih dahulu
    if (!file || file.size === 0) {
      console.error('File tidak valid atau kosong')
      return null
    }

    // Buat nama file yang unique untuk menghindari konflik
    const uniqueFileName = generateUniqueFileName(file.name)
    let filePath: string

    if (matkul && tipe) {
      // Sanitasi nama mata kuliah dan tipe untuk folder
      const sanitizedMatkul = matkul
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '') // Hapus karakter khusus
        .replace(/\s+/g, '-') // Ganti spasi dengan dash
        .trim()

      const sanitizedTipe = tipe.toLowerCase()

      // Struktur: matkul/tipe/namafile
      filePath = `${sanitizedMatkul}/${sanitizedTipe}/${uniqueFileName}`
    } else {
      // Fallback ke nama file unik jika tidak ada parameter
      filePath = uniqueFileName
    }

    console.log('Uploading file to path:', filePath)

    const uploadResult = await supabase.storage
      .from('materi-pdf')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Set ke false untuk menghindari overwrite
      })

    if (uploadResult.error) {
      console.error('Upload error:', uploadResult.error)
      return null
    }

    // Verifikasi file berhasil diupload dengan mencoba mengambil URL
    const urlResult = supabase.storage
      .from('materi-pdf')
      .getPublicUrl(filePath)

    if (!urlResult.data?.publicUrl) {
      console.error('Gagal mendapatkan public URL')
      return null
    }

    // Test apakah file benar-benar bisa diakses
    try {
      const testResponse = await fetch(urlResult.data.publicUrl, { method: 'HEAD' })
      if (!testResponse.ok) {
        console.error('File tidak dapat diakses:', testResponse.status)
        return null
      }
    } catch (fetchError) {
      console.error('Error testing file accessibility:', fetchError)
      // Tetap return URL karena mungkin ini masalah CORS atau network sementara
    }

    console.log('File uploaded successfully:', urlResult.data.publicUrl)
    return urlResult.data.publicUrl

  } catch (error) {
    console.error('Error in uploadToStorage:', error)
    return null
  }
}

// Fungsi untuk validasi dan perbaikan URL
export function validateAndFixUrl(url: string): string | null {
  if (!url) return null
  
  try {
    // Pastikan URL valid
    new URL(url)
    
    // Jika URL sudah benar, return as-is
    if (url.includes('/storage/v1/object/public/materi-pdf/')) {
      return url
    }
    
    // Jika tidak, coba perbaiki format URL
    if (url.includes('supabase.co')) {
      const match = url.match(/([^/]+\.supabase\.co)/)
      if (match) {
        const baseUrl = `https://${match[1]}`
        const filePath = extractFilePathFromUrl(url)
        if (filePath) {
          return `${baseUrl}/storage/v1/object/public/materi-pdf/${filePath}`
        }
      }
    }
    
    return url
  } catch {
    return null
  }
}

// Fungsi untuk mendapatkan URL dengan fallback
export async function getValidFileUrl(originalUrl: string): Promise<string | null> {
  if (!originalUrl) return null

  // Coba URL asli terlebih dahulu
  const fixedUrl = validateAndFixUrl(originalUrl)
  if (!fixedUrl) return null

  try {
    // Test apakah URL bisa diakses
    const testResponse = await fetch(fixedUrl, { method: 'HEAD' })
    if (testResponse.ok) {
      return fixedUrl
    }
  } catch {
    // Jika gagal, coba regenerate URL dari Supabase
  }

  // Jika URL tidak bisa diakses, coba regenerate dari storage
  const filePath = extractFilePathFromUrl(fixedUrl)
  if (filePath) {
    try {
      const { data } = supabase.storage
        .from('materi-pdf')
        .getPublicUrl(filePath)
      
      if (data?.publicUrl) {
        // Test URL yang baru
        try {
          const testResponse = await fetch(data.publicUrl, { method: 'HEAD' })
          if (testResponse.ok) {
            return data.publicUrl
          }
        } catch {
          // Tetap return URL meskipun test gagal
          return data.publicUrl
        }
      }
    } catch (error) {
      console.error('Error regenerating URL:', error)
    }
  }

  return null
}

// Fungsi untuk mengecek apakah file exists di storage
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from('materi-pdf')
      .download(filePath)
    
    return !error && data !== null
  } catch {
    return false
  }
}

// Fungsi rename yang lebih robust
export async function renameFileInStorage(
  oldUrl: string, 
  newFileName: string,
  matkul: string,
  tipe: string
): Promise<string | null> {
  try {
    // Extract old file path
    const oldFilePath = extractFilePathFromUrl(oldUrl)
    if (!oldFilePath) {
      console.error('Cannot extract file path from URL:', oldUrl)
      return null
    }

    // Cek apakah file lama benar-benar ada
    const fileExists = await checkFileExists(oldFilePath)
    if (!fileExists) {
      console.error('Old file does not exist:', oldFilePath)
      return null
    }

    // Download file lama
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('materi-pdf')
      .download(oldFilePath)
    
    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError)
      return null
    }

    // Buat path baru dengan struktur folder yang benar
    const sanitizedMatkul = matkul
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()

    const sanitizedTipe = tipe.toLowerCase()
    
    // Pastikan nama file unik untuk menghindari konflik
    const uniqueFileName = generateUniqueFileName(newFileName)
    const newFilePath = `${sanitizedMatkul}/${sanitizedTipe}/${uniqueFileName}`

    // Upload file ke lokasi baru
    const { error: uploadError } = await supabase.storage
      .from('materi-pdf')
      .upload(newFilePath, fileData, {
        cacheControl: '3600',
        upsert: false // Jangan overwrite
      })

    if (uploadError) {
      console.error('Error uploading file to new location:', uploadError)
      return null
    }

    // Verifikasi file baru berhasil diupload
    const fileExistsAtNewPath = await checkFileExists(newFilePath)
    if (!fileExistsAtNewPath) {
      console.error('File not found at new path after upload:', newFilePath)
      return null
    }

    // Hapus file lama hanya jika upload berhasil
    const { error: deleteError } = await supabase.storage
      .from('materi-pdf')
      .remove([oldFilePath])

    if (deleteError) {
      console.warn('Warning: Failed to delete old file:', deleteError)
      // Tidak return null karena file sudah berhasil dipindah
    }

    // Return URL baru
    const { data } = supabase.storage
      .from('materi-pdf')
      .getPublicUrl(newFilePath)

    const newUrl = data?.publicUrl
    if (newUrl) {
      console.log('File successfully renamed from:', oldFilePath, 'to:', newFilePath)
      return newUrl
    }

    return null
  } catch (error) {
    console.error('Error in renameFileInStorage:', error)
    return null
  }
}

// Sisanya tetap sama seperti kode asli...
export function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)
    const prefix = '/storage/v1/object/public/materi-pdf/'
    const pathStartIndex = fullPath.indexOf(prefix)

    if (pathStartIndex !== -1) {
      return fullPath.slice(pathStartIndex + prefix.length)
    }

    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    const filePath = extractFilePathFromUrl(publicUrl)
    if (!filePath) return false

    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    return !error
  } catch {
    return false
  }
}

export async function getUserRole(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) return null
    const role = data.session.user.user_metadata?.role
    return role || null
  } catch {
    return null
  }
}