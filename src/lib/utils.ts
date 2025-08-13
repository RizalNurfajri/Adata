import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fungsi untuk membersihkan nama file agar URL-safe
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^\w\s.-]/g, '') // Hapus karakter khusus kecuali underscore, spasi, titik, dash
    .replace(/\s+/g, '_') // Ganti spasi dengan underscore
    .trim()
}

export async function uploadToStorage(file: File, matkul?: string, tipe?: string): Promise<string | null> {
  try {
    let filePath: string

    if (matkul && tipe) {
      // Sanitasi nama mata kuliah dan tipe untuk folder
      const sanitizedMatkul = matkul
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '') // Hapus karakter khusus
        .replace(/\s+/g, '-') // Ganti spasi dengan dash
        .trim()

      const sanitizedTipe = tipe.toLowerCase()

      // Sanitasi nama file untuk menghindari masalah URL encoding
      const sanitizedFileName = sanitizeFileName(file.name)

      // Struktur: matkul/tipe/namafile
      filePath = `${sanitizedMatkul}/${sanitizedTipe}/${sanitizedFileName}`
    } else {
      // Fallback ke nama file yang sudah disanitasi jika tidak ada parameter
      filePath = sanitizeFileName(file.name)
    }

    const uploadResult = await supabase.storage
      .from('materi-pdf')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Set ke true untuk menimpa file dengan nama yang sama
      })

    if (uploadResult.error) {
      console.error('Upload error:', uploadResult.error)
      return null
    }

    // Gunakan getPublicUrl dengan encoding yang benar
    const urlResult = supabase.storage
      .from('materi-pdf')
      .getPublicUrl(filePath)

    // Pastikan URL tidak mengandung karakter yang menyebabkan masalah
    const publicUrl = urlResult.data?.publicUrl
    if (publicUrl) {
      // Verifikasi bahwa file benar-benar ada dengan mencoba mengakses metadata
      const { data: fileInfo, error: fileError } = await supabase.storage
        .from('materi-pdf')
        .list(filePath.substring(0, filePath.lastIndexOf('/')), {
          search: filePath.substring(filePath.lastIndexOf('/') + 1)
        })

      if (fileError || !fileInfo || fileInfo.length === 0) {
        console.error('File verification failed:', fileError)
        return null
      }
    }

    return publicUrl ?? null
  } catch (error) {
    console.error('Upload exception:', error)
    return null
  }
}

// Fungsi baru untuk rename/memindahkan file di storage
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
      console.error('Could not extract file path from URL:', oldUrl)
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
    
    // Sanitasi nama file baru
    const sanitizedNewFileName = sanitizeFileName(newFileName)
    const newFilePath = `${sanitizedMatkul}/${sanitizedTipe}/${sanitizedNewFileName}`

    // Upload file ke lokasi baru
    const { error: uploadError } = await supabase.storage
      .from('materi-pdf')
      .upload(newFilePath, fileData, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading file to new location:', uploadError)
      return null
    }

    // Hapus file lama
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

    return data?.publicUrl ?? null
  } catch (error) {
    console.error('Error in renameFileInStorage:', error)
    return null
  }
}

export async function debugStorageContents(): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })
    
    if (error) {
      console.error('Debug storage error:', error)
    } else {
      console.log('Storage contents:', data)
    }
  } catch (error) {
    console.error('Debug storage exception:', error)
  }
}

// Fungsi yang diperbaiki untuk extract file path dari URL
function extractFilePathMethod1(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const pathname = url.pathname
    const prefix = '/storage/v1/object/public/materi-pdf/'
    
    if (pathname.startsWith(prefix)) {
      const filePath = pathname.substring(prefix.length)
      // Decode URI component dengan benar
      return decodeURIComponent(filePath)
    }
    
    return null
  } catch (error) {
    console.error('extractFilePathMethod1 error:', error)
    return null
  }
}

function extractFilePathMethod2(publicUrl: string): string | null {
  try {
    // Pattern yang lebih ketat untuk mencocokkan URL
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
    return null
  } catch (error) {
    console.error('extractFilePathMethod2 error:', error)
    return null
  }
}

function extractFilePathMethod3(publicUrl: string): string | null {
  try {
    const searchString = '/storage/v1/object/public/materi-pdf/'
    const index = publicUrl.indexOf(searchString)
    if (index !== -1) {
      const filePath = publicUrl.substring(index + searchString.length)
      return decodeURIComponent(filePath)
    }
    return null
  } catch (error) {
    console.error('extractFilePathMethod3 error:', error)
    return null
  }
}

async function deleteByBruteForceSearch(publicUrl: string): Promise<boolean> {
  try {
    const urlParts = publicUrl.split('/')
    const fullFileName = urlParts[urlParts.length - 1]
    const fileName = decodeURIComponent(fullFileName)

    // Cari di semua folder dan subfolder
    const { data: files, error } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })

    if (error) return false

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

      if (!deleteError) return true
    }

    return false
  } catch {
    return false
  }
}

export async function deleteFromStorageEnhanced(publicUrl: string): Promise<boolean> {
  try {
    await debugStorageContents()
    const filePath1 = extractFilePathMethod1(publicUrl)
    const filePath2 = extractFilePathMethod2(publicUrl)
    const filePath3 = extractFilePathMethod3(publicUrl)
    const filePaths = [filePath1, filePath2, filePath3].filter(Boolean)

    // Log untuk debugging
    console.log('Trying to delete file with paths:', filePaths)

    for (const filePath of filePaths) {
      if (filePath) {
        const { error } = await supabase.storage
          .from('materi-pdf')
          .remove([filePath])

        if (!error) {
          console.log('Successfully deleted file:', filePath)
          return true
        } else {
          console.error('Delete error for path:', filePath, error)
        }
      }
    }

    const bruteForceResult = await deleteByBruteForceSearch(publicUrl)
    return bruteForceResult
  } catch (error) {
    console.error('deleteFromStorageEnhanced error:', error)
    return false
  }
}

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

export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    const filePath = extractFilePathFromUrl(publicUrl)
    if (!filePath) {
      console.error('Could not extract file path from URL:', publicUrl)
      return false
    }

    console.log('Attempting to delete file at path:', filePath)

    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    console.log('Successfully deleted file:', filePath)
    return true
  } catch (error) {
    console.error('deleteFromStorage exception:', error)
    return false
  }
}

export async function deleteFromStorageAlternative(publicUrl: string): Promise<boolean> {
  try {
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (!match) {
      console.error('URL pattern does not match:', publicUrl)
      return false
    }

    const filePath = decodeURIComponent(match[1])
    console.log('Alternative delete attempt for path:', filePath)

    // Verify file exists first
    const { data: listResult } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })

    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    if (error) {
      console.error('Alternative delete error:', error)
      return false
    }

    console.log('Successfully deleted file (alternative method):', filePath)
    return true
  } catch (error) {
    console.error('deleteFromStorageAlternative exception:', error)
    return false
  }
}

export function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    // Method 1: URL parsing
    const url = new URL(publicUrl)
    const pathname = url.pathname
    const prefix = '/storage/v1/object/public/materi-pdf/'
    
    if (pathname.startsWith(prefix)) {
      const filePath = pathname.substring(prefix.length)
      const decodedPath = decodeURIComponent(filePath)
      console.log('Extracted file path (method 1):', decodedPath)
      return decodedPath
    }

    // Method 2: Regex matching
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (match && match[1]) {
      const decodedPath = decodeURIComponent(match[1])
      console.log('Extracted file path (method 2):', decodedPath)
      return decodedPath
    }

    console.error('Could not extract file path from URL:', publicUrl)
    return null
  } catch (error) {
    console.error('extractFilePathFromUrl error:', error)
    return null
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

// Fungsi tambahan untuk memvalidasi URL PDF
export async function validatePdfUrl(url: string): Promise<boolean> {
  try {
    const filePath = extractFilePathFromUrl(url)
    if (!filePath) return false

    // Cek apakah file benar-benar ada di storage
    const { data, error } = await supabase.storage
      .from('materi-pdf')
      .list(filePath.substring(0, filePath.lastIndexOf('/')), {
        search: filePath.substring(filePath.lastIndexOf('/') + 1)
      })

    if (error || !data || data.length === 0) {
      console.error('File validation failed:', error || 'File not found')
      return false
    }

    return true
  } catch (error) {
    console.error('validatePdfUrl error:', error)
    return false
  }
}