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

// Fungsi enhanced delete untuk backward compatibility
export async function deleteFromStorageEnhanced(publicUrl: string): Promise<boolean> {
  try {
    // Method 1: Extract path dan delete langsung
    const filePath = extractFilePathFromUrl(publicUrl)
    if (filePath) {
      const { error } = await supabase.storage
        .from('materi-pdf')
        .remove([filePath])

      if (!error) {
        console.log('File deleted successfully via method 1')
        return true
      }
    }

    // Method 2: Brute force search jika method 1 gagal
    const bruteForceResult = await deleteByBruteForceSearch(publicUrl)
    if (bruteForceResult) {
      console.log('File deleted successfully via brute force search')
      return true
    }

    console.warn('Failed to delete file:', publicUrl)
    return false
  } catch (error) {
    console.error('Error in deleteFromStorageEnhanced:', error)
    return false
  }
}

// Helper function untuk brute force search
async function deleteByBruteForceSearch(publicUrl: string): Promise<boolean> {
  try {
    const urlParts = publicUrl.split('/')
    const fullFileName = urlParts[urlParts.length - 1]
    const fileName = decodeURIComponent(fullFileName)

    // Fungsi rekursif untuk mencari file dalam semua subfolder
    const searchInFolder = async (folderPath: string = ''): Promise<string | null> => {
      const { data: folderFiles } = await supabase.storage
        .from('materi-pdf')
        .list(folderPath, { limit: 1000 })

      if (folderFiles) {
        for (const file of folderFiles) {
          const currentPath = folderPath ? `${folderPath}/${file.name}` : file.name
          
          if (file.name === fileName) {
            return currentPath
          }
          
          // Jika ini adalah folder, cari di dalamnya
          if (file.id === null) { // folder biasanya memiliki id null
            const found = await searchInFolder(currentPath)
            if (found) return found
          }
        }
      }
      return null
    }

    const foundPath = await searchInFolder()
    if (foundPath) {
      const { error: deleteError } = await supabase.storage
        .from('materi-pdf')
        .remove([foundPath])

      return !deleteError
    }

    return false
  } catch {
    return false
  }
}

// Alternative delete method untuk backward compatibility
export async function deleteFromStorageAlternative(publicUrl: string): Promise<boolean> {
  try {
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (!match) return false

    const filePath = decodeURIComponent(match[1])

    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    return !error
  } catch {
    return false
  }
}

// Debug function untuk troubleshooting
export async function debugStorageContents(): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })
      
    if (error) {
      console.error('Error listing storage contents:', error)
    } else {
      console.log('Storage contents:', data)
    }
  } catch (error) {
    console.error('Error in debugStorageContents:', error)
  }
}

// Cleanup function untuk menghapus orphaned files
export async function cleanupOrphanedFiles(): Promise<void> {
  try {
    // Fungsi rekursif untuk mendapatkan semua file dari semua folder
    const getAllFiles = async (folderPath: string = ''): Promise<string[]> => {
      const allFiles: string[] = []
      
      const { data: items, error } = await supabase.storage
        .from('materi-pdf')
        .list(folderPath, { limit: 1000 })

      if (error || !items) return allFiles

      for (const item of items) {
        const currentPath = folderPath ? `${folderPath}/${item.name}` : item.name
        
        if (item.id === null) {
          // Ini adalah folder, cari file di dalamnya
          const subFiles = await getAllFiles(currentPath)
          allFiles.push(...subFiles)
        } else {
          // Ini adalah file
          allFiles.push(currentPath)
        }
      }
      
      return allFiles
    }

    const storageFiles = await getAllFiles()

    const { data: dbMaterials, error: dbError } = await supabase
      .from('materials')
      .select('link')
      .not('link', 'is', null)

    if (dbError) return

    const dbFilePaths = new Set(
      dbMaterials?.map(material => {
        if (material.link) {
          // Extract file path dari URL
          const match = material.link.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
          return match ? decodeURIComponent(match[1]) : null
        }
        return null
      }).filter(Boolean) || []
    )

    const orphanedFiles = storageFiles.filter(filePath => 
      !dbFilePaths.has(filePath)
    )

    console.log('Orphaned files found:', orphanedFiles)

    // Uncomment jika ingin menghapus orphaned files
    /*
    for (const filePath of orphanedFiles) {
      const { error } = await supabase.storage
        .from('materi-pdf')
        .remove([filePath])
      
      if (!error) {
        console.log('Deleted orphaned file:', filePath)
      }
    }
    */
  } catch (error) {
    console.error('Error in cleanup:', error)
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