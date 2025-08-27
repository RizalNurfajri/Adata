import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function untuk sanitasi nama folder
function sanitizeFolderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Hapus karakter khusus
    .replace(/\s+/g, '-') // Ganti spasi dengan dash
    .trim()
}

export async function uploadToStorage(file: File, matkul?: string, tipe?: string): Promise<string | null> {
  try {
    let filePath: string

    if (matkul && tipe) {
      const sanitizedMatkul = sanitizeFolderName(matkul)
      const sanitizedTipe = tipe.toLowerCase()
      filePath = `${sanitizedMatkul}/${sanitizedTipe}/${file.name}`
    } else {
      filePath = file.name
    }

    const uploadResult = await supabase.storage
      .from('materi-pdf')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadResult.error) {
      console.error('Upload error:', uploadResult.error)
      return null
    }

    const urlResult = supabase.storage
      .from('materi-pdf')
      .getPublicUrl(filePath)

    return urlResult.data?.publicUrl ?? null
  } catch (error) {
    console.error('Upload exception:', error)
    return null
  }
}

// Improved renameFileInStorage function
export async function renameFileInStorage(
  oldUrl: string, 
  newFileName: string,
  matkul: string,
  tipe: string
): Promise<string | null> {
  try {
    console.log('Starting file reorganization:', { oldUrl, newFileName, matkul, tipe })
    
    // Extract old file path
    const oldFilePath = extractFilePathFromUrl(oldUrl)
    if (!oldFilePath) {
      console.error('Could not extract file path from URL:', oldUrl)
      return null
    }

    console.log('Old file path:', oldFilePath)

    // Download file lama
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('materi-pdf')
      .download(oldFilePath)
    
    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError)
      return null
    }

    console.log('File downloaded successfully, size:', fileData.size)

    // Buat path baru dengan struktur folder yang benar
    const sanitizedMatkul = sanitizeFolderName(matkul)
    const sanitizedTipe = tipe.toLowerCase()
    const newFilePath = `${sanitizedMatkul}/${sanitizedTipe}/${newFileName}`

    console.log('New file path:', newFilePath)

    // Cek apakah file sudah ada di lokasi baru
    const { data: existingFile } = await supabase.storage
      .from('materi-pdf')
      .list(`${sanitizedMatkul}/${sanitizedTipe}`, {
        search: newFileName
      })

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

    console.log('File uploaded to new location successfully')

    // Hapus file lama jika berbeda dari lokasi baru
    if (oldFilePath !== newFilePath) {
      const { error: deleteError } = await supabase.storage
        .from('materi-pdf')
        .remove([oldFilePath])

      if (deleteError) {
        console.warn('Warning: Failed to delete old file:', deleteError)
        // Tidak return null karena file sudah berhasil dipindah
      } else {
        console.log('Old file deleted successfully')
      }
    }

    // Return URL baru
    const { data } = supabase.storage
      .from('materi-pdf')
      .getPublicUrl(newFilePath)

    const newUrl = data?.publicUrl ?? null
    console.log('New URL generated:', newUrl)

    return newUrl
  } catch (error) {
    console.error('Error in renameFileInStorage:', error)
    return null
  }
}

// Improved file path extraction
export function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    // Method 1: URL parsing
    const url = new URL(publicUrl)
    const pathname = decodeURIComponent(url.pathname)
    const prefix = '/storage/v1/object/public/materi-pdf/'
    
    if (pathname.includes(prefix)) {
      const filePath = pathname.substring(pathname.indexOf(prefix) + prefix.length)
      if (filePath) return filePath
    }

    // Method 2: Regex matching
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)/)
    if (match) {
      return decodeURIComponent(match[1])
    }

    console.error('Could not extract file path from URL:', publicUrl)
    return null
  } catch (error) {
    console.error('Error extracting file path:', error)
    return null
  }
}

// Enhanced delete function with better error handling
export async function deleteFromStorageEnhanced(publicUrl: string): Promise<boolean> {
  try {
    console.log('Attempting to delete file:', publicUrl)
    
    const filePath = extractFilePathFromUrl(publicUrl)
    if (!filePath) {
      console.error('Could not extract file path for deletion')
      return false
    }

    console.log('Extracted file path for deletion:', filePath)

    // Coba hapus file
    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      
      // Fallback: coba dengan metode brute force search
      return await deleteByBruteForceSearch(publicUrl)
    }

    console.log('File deleted successfully')
    return true
  } catch (error) {
    console.error('Delete exception:', error)
    return false
  }
}

// Brute force search untuk file yang sulit dihapus
async function deleteByBruteForceSearch(publicUrl: string): Promise<boolean> {
  try {
    const urlParts = publicUrl.split('/')
    const fullFileName = urlParts[urlParts.length - 1]
    const fileName = decodeURIComponent(fullFileName)

    console.log('Attempting brute force search for:', fileName)

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
      console.log('File found at path:', foundPath)
      const { error: deleteError } = await supabase.storage
        .from('materi-pdf')
        .remove([foundPath])

      if (!deleteError) {
        console.log('File deleted via brute force method')
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Brute force delete failed:', error)
    return false
  }
}

// Legacy delete functions (keeping for backward compatibility)
export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)
    const prefix = '/storage/v1/object/public/'
    const pathStartIndex = fullPath.indexOf(prefix)
    if (pathStartIndex === -1) return false

    const fullStoragePath = fullPath.slice(pathStartIndex + prefix.length)
    const [bucketName, ...fileParts] = fullStoragePath.split('/')
    const filePath = fileParts.join('/')

    if (!filePath || bucketName !== 'materi-pdf') return false

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    return !error
  } catch {
    return false
  }
}

export async function deleteFromStorageAlternative(publicUrl: string): Promise<boolean> {
  try {
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (!match) return false

    const filePath = match[1]
    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    return !error
  } catch {
    return false
  }
}

// Utility functions
export async function debugStorageContents(): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })
    
    console.log('Storage contents:', data, error)
  } catch (error) {
    console.error('Debug error:', error)
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

    // Uncomment untuk menghapus orphaned files
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