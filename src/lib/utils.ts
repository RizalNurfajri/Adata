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

      // Gunakan nama file asli tanpa perubahan
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
        upsert: true, // Set ke true untuk menimpa file dengan nama yang sama jika ada
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
  } catch (error) {
    console.error('Extract file path method 1 error:', error)
    return null
  }
}

function extractFilePathMethod2(publicUrl: string): string | null {
  try {
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch (error) {
    console.error('Extract file path method 2 error:', error)
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
  } catch (error) {
    console.error('Extract file path method 3 error:', error)
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

    if (error) {
      console.error('Brute force search error:', error)
      return false
    }

    // Fungsi rekursif untuk mencari file dalam semua subfolder
    const searchInFolder = async (folderPath: string = ''): Promise<string | null> => {
      const { data: folderFiles, error: listError } = await supabase.storage
        .from('materi-pdf')
        .list(folderPath, { limit: 1000 })

      if (listError) {
        console.error('List folder error:', listError)
        return null
      }

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

      if (!deleteError) {
        console.log('Successfully deleted file:', foundPath)
        return true
      } else {
        console.error('Delete error:', deleteError)
      }
    }

    return false
  } catch (error) {
    console.error('Brute force delete error:', error)
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

        if (!error) {
          console.log('Successfully deleted file using method:', filePath)
          return true
        } else {
          console.error('Delete error for path:', filePath, error)
        }
      }
    }

    const bruteForceResult = await deleteByBruteForceSearch(publicUrl)
    return bruteForceResult
  } catch (error) {
    console.error('Enhanced delete error:', error)
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

      if (error || !items) {
        console.error('Get all files error:', error)
        return allFiles
      }

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

    if (dbError) {
      console.error('DB query error:', dbError)
      return
    }

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
    if (!publicUrl) {
      console.error('No public URL provided')
      return false
    }

    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)
    const prefix = '/storage/v1/object/public/'
    const pathStartIndex = fullPath.indexOf(prefix)
    if (pathStartIndex === -1) {
      console.error('Invalid URL format')
      return false
    }

    const fullStoragePath = fullPath.slice(pathStartIndex + prefix.length)
    const [bucketName, ...fileParts] = fullStoragePath.split('/')
    const filePath = fileParts.join('/')

    if (!filePath || bucketName !== 'materi-pdf') {
      console.error('Invalid file path or bucket name')
      return false
    }

    console.log('Attempting to delete file:', filePath)

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('Delete from storage error:', error)
      return false
    }

    console.log('Successfully deleted file:', filePath)
    return true
  } catch (error) {
    console.error('Delete from storage exception:', error)
    return false
  }
}

export async function deleteFromStorageAlternative(publicUrl: string): Promise<boolean> {
  try {
    if (!publicUrl) {
      console.error('No public URL provided for alternative method')
      return false
    }

    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (!match) {
      console.error('URL pattern not matched for alternative method')
      return false
    }

    const filePath = decodeURIComponent(match[1])

    // Verifikasi file exists sebelum menghapus
    const { data: listResult, error: listError } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })

    if (listError) {
      console.error('List error in alternative method:', listError)
    }

    console.log('Attempting to delete file (alternative method):', filePath)

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
    console.error('Alternative delete exception:', error)
    return false
  }
}

export function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    if (!publicUrl) return null

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
    return match ? decodeURIComponent(match[1]) : null
  } catch (error) {
    console.error('Extract file path error:', error)
    return null
  }
}

export async function getUserRole(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) {
      console.error('Get user role error:', error)
      return null
    }
    const role = data.session.user.user_metadata?.role
    return role || null
  } catch (error) {
    console.error('Get user role exception:', error)
    return null
  }
}