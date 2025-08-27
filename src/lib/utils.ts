import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function uploadToStorage(file: File, matkul?: string, tipe?: string): Promise<string | null> {
  try {
    let filePath: string
    const fileName = file.name // Gunakan nama file asli tanpa sanitasi

    if (matkul && tipe) {
      // Hanya sanitasi folder path, bukan nama file
      const sanitizedMatkul = matkul
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '') // Hapus karakter khusus
        .replace(/\s+/g, '-') // Ganti spasi dengan dash
        .trim()

      const sanitizedTipe = tipe.toLowerCase()

      // Struktur: matkul/tipe/namafile (nama file tetap asli)
      filePath = `${sanitizedMatkul}/${sanitizedTipe}/${fileName}`
    } else {
      // Fallback ke nama file asli jika tidak ada parameter
      filePath = fileName
    }

    console.log('Uploading file to path:', filePath)

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

    const urlResult = supabase.storage
      .from('materi-pdf')
      .getPublicUrl(filePath)

    console.log('Generated URL:', urlResult.data?.publicUrl)
    return urlResult.data?.publicUrl ?? null
  } catch (error) {
    console.error('Upload function error:', error)
    return null
  }
}

// Improved file path extraction function
export function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    // Method 1: URL parsing
    const url = new URL(publicUrl)
    const fullPath = decodeURIComponent(url.pathname)
    const prefix = '/storage/v1/object/public/materi-pdf/'
    
    if (fullPath.includes(prefix)) {
      return fullPath.split(prefix)[1]
    }

    // Method 2: Regex matching
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)$/)
    if (match) {
      return decodeURIComponent(match[1])
    }

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
    
    // Get file path using improved extraction
    const filePath = extractFilePathFromUrl(publicUrl)
    
    if (!filePath) {
      console.error('Could not extract file path from URL:', publicUrl)
      return false
    }

    console.log('Extracted file path:', filePath)

    // Try to delete the file
    const { error } = await supabase.storage
      .from('materi-pdf')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      
      // If regular delete fails, try alternative methods
      return await deleteByBruteForceSearch(publicUrl)
    }

    console.log('File deleted successfully:', filePath)
    return true
  } catch (error) {
    console.error('Delete function error:', error)
    return false
  }
}

// Brute force search for file deletion (fallback method)
async function deleteByBruteForceSearch(publicUrl: string): Promise<boolean> {
  try {
    console.log('Using brute force search for file deletion')
    
    const urlParts = publicUrl.split('/')
    const fullFileName = urlParts[urlParts.length - 1]
    const fileName = decodeURIComponent(fullFileName)

    console.log('Searching for file:', fileName)

    // Function to recursively search through folders
    const searchInFolder = async (folderPath: string = ''): Promise<string | null> => {
      const { data: folderFiles, error } = await supabase.storage
        .from('materi-pdf')
        .list(folderPath, { limit: 1000 })

      if (error || !folderFiles) {
        console.error('Error listing folder:', folderPath, error)
        return null
      }

      for (const file of folderFiles) {
        const currentPath = folderPath ? `${folderPath}/${file.name}` : file.name
        
        if (file.name === fileName || currentPath.endsWith(fileName)) {
          console.log('Found file at:', currentPath)
          return currentPath
        }
        
        // If this is a folder (no file extension and id is null), search inside it
        if (!file.name.includes('.') && file.id === null) {
          const found = await searchInFolder(currentPath)
          if (found) return found
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
        console.log('File deleted via brute force search:', foundPath)
        return true
      } else {
        console.error('Failed to delete found file:', deleteError)
      }
    }

    console.log('File not found via brute force search')
    return false
  } catch (error) {
    console.error('Brute force search error:', error)
    return false
  }
}

// Debug function to list storage contents
export async function debugStorageContents(): Promise<void> {
  try {
    console.log('=== Storage Debug Info ===')
    
    const listAllFiles = async (folderPath: string = '', level: number = 0): Promise<void> => {
      const indent = '  '.repeat(level)
      
      const { data, error } = await supabase.storage
        .from('materi-pdf')
        .list(folderPath, { limit: 100 })
      
      if (error) {
        console.error(`${indent}Error listing ${folderPath}:`, error)
        return
      }
      
      if (data) {
        console.log(`${indent}📁 ${folderPath || 'root'} (${data.length} items)`)
        
        for (const item of data) {
          const currentPath = folderPath ? `${folderPath}/${item.name}` : item.name
          
          if (item.id === null) {
            // This is likely a folder
            console.log(`${indent}  📁 ${item.name}/`)
            if (level < 3) { // Prevent infinite recursion
              await listAllFiles(currentPath, level + 1)
            }
          } else {
            // This is a file
            console.log(`${indent}  📄 ${item.name} (${item.metadata?.size || 'unknown'} bytes)`)
          }
        }
      }
    }
    
    await listAllFiles()
    console.log('=== End Storage Debug ===')
  } catch (error) {
    console.error('Debug storage error:', error)
  }
}

// Cleanup orphaned files function
export async function cleanupOrphanedFiles(): Promise<void> {
  try {
    console.log('Starting orphaned files cleanup...')
    
    // Get all files from storage recursively
    const getAllFiles = async (folderPath: string = ''): Promise<string[]> => {
      const allFiles: string[] = []
      
      const { data: items, error } = await supabase.storage
        .from('materi-pdf')
        .list(folderPath, { limit: 1000 })

      if (error || !items) return allFiles

      for (const item of items) {
        const currentPath = folderPath ? `${folderPath}/${item.name}` : item.name
        
        if (item.id === null) {
          // This is a folder, recurse into it
          const subFiles = await getAllFiles(currentPath)
          allFiles.push(...subFiles)
        } else {
          // This is a file
          allFiles.push(currentPath)
        }
      }
      
      return allFiles
    }

    const storageFiles = await getAllFiles()
    console.log('Found', storageFiles.length, 'files in storage')

    // Get all file links from database
    const { data: dbMaterials, error: dbError } = await supabase
      .from('materials')
      .select('link')
      .not('link', 'is', null)

    if (dbError) {
      console.error('Error fetching database materials:', dbError)
      return
    }

    const dbFilePaths = new Set(
      dbMaterials?.map(material => {
        if (material.link) {
          return extractFilePathFromUrl(material.link)
        }
        return null
      }).filter(Boolean) || []
    )

    console.log('Found', dbFilePaths.size, 'file references in database')

    const orphanedFiles = storageFiles.filter(filePath => 
      !dbFilePaths.has(filePath)
    )

    console.log('Orphaned files found:', orphanedFiles)

    if (orphanedFiles.length > 0) {
      console.log('To delete these orphaned files, uncomment the deletion code in cleanupOrphanedFiles()')
      
      // Uncomment the lines below to actually delete orphaned files
      /*
      for (const filePath of orphanedFiles) {
        const { error } = await supabase.storage
          .from('materi-pdf')
          .remove([filePath])
        
        if (!error) {
          console.log('Deleted orphaned file:', filePath)
        } else {
          console.error('Failed to delete:', filePath, error)
        }
      }
      */
    }
  } catch (error) {
    console.error('Error in cleanup:', error)
  }
}

// Legacy delete functions (kept for backward compatibility)
export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  console.warn('deleteFromStorage is deprecated, use deleteFromStorageEnhanced instead')
  return deleteFromStorageEnhanced(publicUrl)
}

export async function deleteFromStorageAlternative(publicUrl: string): Promise<boolean> {
  console.warn('deleteFromStorageAlternative is deprecated, use deleteFromStorageEnhanced instead')
  return deleteFromStorageEnhanced(publicUrl)
}

// Removed the old renameFileInStorage function since it was causing issues
// File reorganization is now handled directly in MaterialForm.tsx

// User role function
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