import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

      // Struktur: matkul/tipe/namafile
      filePath = `${sanitizedMatkul}/${sanitizedTipe}/${file.name}`
    } else {
      // Fallback ke nama file asli jika tidak ada parameter
      filePath = file.name
    }

    const uploadResult = await supabase.storage
      .from('materi-pdf')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Set ke true untuk menimpa file dengan nama yang sama
      })

    if (uploadResult.error) return null

    const urlResult = supabase.storage
      .from('materi-pdf')
      .getPublicUrl(filePath)

    return urlResult.data?.publicUrl ?? null
  } catch {
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
    if (!oldFilePath) return null

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
    const newFilePath = `${sanitizedMatkul}/${sanitizedTipe}/${newFileName}`

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
  } catch {}
}

function extractFilePathMethod1(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const pathname = decodeURIComponent(url.pathname)
    const prefix = '/storage/v1/object/public/'
    const startIndex = pathname.indexOf(prefix)
    if (startIndex === -1) return null
    const fullStoragePath = pathname.slice(startIndex + prefix.length)
    const [bucketName, ...fileParts] = fullStoragePath.split('/')
    if (bucketName !== 'materi-pdf') return null
    return fileParts.join('/')
  } catch {
    return null
  }
}

function extractFilePathMethod2(publicUrl: string): string | null {
  try {
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

function extractFilePathMethod3(publicUrl: string): string | null {
  try {
    const searchString = '/storage/v1/object/public/materi-pdf/'
    const index = publicUrl.indexOf(searchString)
    if (index === -1) return null
    const filePath = publicUrl.slice(index + searchString.length)
    return decodeURIComponent(filePath)
  } catch {
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

    for (const filePath of filePaths) {
      if (filePath) {
        const { error } = await supabase.storage
          .from('materi-pdf')
          .remove([filePath])

        if (!error) return true
      }
    }

    const bruteForceResult = await deleteByBruteForceSearch(publicUrl)
    return bruteForceResult
  } catch {
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

    if (error) return false

    return true
  } catch {
    return false
  }
}

export async function deleteFromStorageAlternative(publicUrl: string): Promise<boolean> {
  try {
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (!match) return false

    const filePath = match[1]

    const { data: listResult } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })

    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    if (error) return false

    return true
  } catch {
    return false
  }
}

export function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)
    const prefix = '/storage/v1/object/public/'
    const pathStartIndex = fullPath.indexOf(prefix)

    if (pathStartIndex !== -1) {
      const fullStoragePath = fullPath.slice(pathStartIndex + prefix.length)
      const [bucketName, ...fileParts] = fullStoragePath.split('/')
      return fileParts.join('/')
    }

    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    return match ? match[1] : null
  } catch {
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