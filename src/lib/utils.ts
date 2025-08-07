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

// ✅ Debug function untuk melihat semua file di bucket
export async function debugStorageContents(): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })
    
    if (error) {
      console.error('Error listing storage contents:', error)
    } else {
      console.log('=== STORAGE CONTENTS ===')
      data?.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${file.metadata?.size || 'unknown'} bytes)`)
      })
      console.log('=== END STORAGE CONTENTS ===')
    }
  } catch (error) {
    console.error('Debug storage contents error:', error)
  }
}

// Method 1: URL parsing approach
function extractFilePathMethod1(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const pathname = decodeURIComponent(url.pathname)
    console.log('Full pathname:', pathname)
    
    // Pattern: /storage/v1/object/public/materi-pdf/filename
    const prefix = '/storage/v1/object/public/'
    const startIndex = pathname.indexOf(prefix)
    
    if (startIndex === -1) return null
    
    const fullStoragePath = pathname.slice(startIndex + prefix.length)
    const [bucketName, ...fileParts] = fullStoragePath.split('/')
    
    if (bucketName !== 'materi-pdf') return null
    
    return fileParts.join('/')
  } catch (error) {
    console.error('Method 1 extraction error:', error)
    return null
  }
}

// Method 2: Regex approach
function extractFilePathMethod2(publicUrl: string): string | null {
  try {
    const match = publicUrl.match(/\/storage\/v1\/object\/public\/materi-pdf\/(.+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch (error) {
    console.error('Method 2 extraction error:', error)
    return null
  }
}

// Method 3: String manipulation approach
function extractFilePathMethod3(publicUrl: string): string | null {
  try {
    const searchString = '/storage/v1/object/public/materi-pdf/'
    const index = publicUrl.indexOf(searchString)
    
    if (index === -1) return null
    
    const filePath = publicUrl.slice(index + searchString.length)
    return decodeURIComponent(filePath)
  } catch (error) {
    console.error('Method 3 extraction error:', error)
    return null
  }
}

// Brute force: Search through all files and match by filename or timestamp
async function deleteByBruteForceSearch(publicUrl: string): Promise<boolean> {
  try {
    console.log('Starting brute force search...')
    
    // Extract filename from URL
    const urlParts = publicUrl.split('/')
    const fullFileName = urlParts[urlParts.length - 1]
    const fileName = decodeURIComponent(fullFileName)
    
    console.log('Looking for file:', fileName)
    
    // List all files in storage
    const { data: files, error } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })
    
    if (error) {
      console.error('Error listing files for brute force:', error)
      return false
    }
    
    // Find exact match
    const exactMatch = files?.find(file => file.name === fileName)
    if (exactMatch) {
      console.log('Found exact match:', exactMatch.name)
      const { error: deleteError } = await supabase.storage
        .from('materi-pdf')
        .remove([exactMatch.name])
      
      if (!deleteError) {
        console.log('✅ Brute force delete successful')
        return true
      } else {
        console.error('Brute force delete error:', deleteError)
      }
    }
    
    // If no exact match, look for similar files (in case of encoding issues)
    console.log('No exact match found, looking for similar files...')
    const similarFiles = files?.filter(file => {
      const similarity = file.name.includes(fileName.split('-')[0]) || 
                        fileName.includes(file.name.split('-')[0])
      return similarity
    })
    
    console.log('Similar files found:', similarFiles?.map(f => f.name))
    
    return false
  } catch (error) {
    console.error('Brute force search error:', error)
    return false
  }
}

// ✅ Enhanced delete function dengan multiple fallback methods
export async function deleteFromStorageEnhanced(publicUrl: string): Promise<boolean> {
  console.log('=== ENHANCED DELETE FROM STORAGE ===')
  console.log('Target URL:', publicUrl)
  
  try {
    // Debug: List semua file terlebih dahulu
    await debugStorageContents()
    
    // Method 1: Extract menggunakan URL parsing
    const filePath1 = extractFilePathMethod1(publicUrl)
    console.log('Method 1 - Extracted path:', filePath1)
    
    // Method 2: Extract menggunakan regex
    const filePath2 = extractFilePathMethod2(publicUrl)
    console.log('Method 2 - Extracted path:', filePath2)
    
    // Method 3: Extract menggunakan string manipulation
    const filePath3 = extractFilePathMethod3(publicUrl)
    console.log('Method 3 - Extracted path:', filePath3)
    
    // Try each method
    const filePaths = [filePath1, filePath2, filePath3].filter(Boolean)
    
    for (const filePath of filePaths) {
      if (filePath) {
        console.log(`Attempting to delete with path: "${filePath}"`)
        
        const { error } = await supabase.storage
          .from('materi-pdf')
          .remove([filePath])
        
        if (!error) {
          console.log('✅ File successfully deleted with path:', filePath)
          console.log('=== END ENHANCED DELETE ===')
          return true
        } else {
          console.error('Delete failed for path:', filePath, 'Error:', error)
        }
      }
    }
    
    // If all methods failed, try brute force search
    console.log('All standard methods failed, trying brute force...')
    const bruteForceResult = await deleteByBruteForceSearch(publicUrl)
    
    console.log('=== END ENHANCED DELETE ===')
    return bruteForceResult
    
  } catch (error) {
    console.error('Enhanced delete error:', error)
    console.log('=== END ENHANCED DELETE (ERROR) ===')
    return false
  }
}

// ✅ Function untuk menghapus semua file orphaned (tidak ada di database)
export async function cleanupOrphanedFiles(): Promise<void> {
  try {
    console.log('=== CLEANUP ORPHANED FILES ===')
    
    // Get all files from storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })
    
    if (storageError) {
      console.error('Error getting storage files:', storageError)
      return
    }
    
    // Get all file URLs from database
    const { data: dbMaterials, error: dbError } = await supabase
      .from('materials')
      .select('link')
      .not('link', 'is', null)
    
    if (dbError) {
      console.error('Error getting database materials:', dbError)
      return
    }
    
    // Extract filenames from database URLs
    const dbFileNames = new Set(
      dbMaterials?.map(material => {
        if (material.link) {
          const urlParts = material.link.split('/')
          return decodeURIComponent(urlParts[urlParts.length - 1])
        }
        return null
      }).filter(Boolean) || []
    )
    
    console.log('Files in database:', Array.from(dbFileNames))
    console.log('Files in storage:', storageFiles?.map(f => f.name))
    
    // Find orphaned files
    const orphanedFiles = storageFiles?.filter(file => 
      !dbFileNames.has(file.name)
    ) || []
    
    console.log('Orphaned files found:', orphanedFiles.map(f => f.name))
    
    if (orphanedFiles.length > 0) {
      console.log(`Found ${orphanedFiles.length} orphaned files. Delete them? (You need to confirm manually)`)
      // Uncomment the following lines to actually delete orphaned files
      /*
      for (const file of orphanedFiles) {
        const { error } = await supabase.storage
          .from('materi-pdf')
          .remove([file.name])
        
        if (error) {
          console.error(`Failed to delete orphaned file ${file.name}:`, error)
        } else {
          console.log(`✅ Deleted orphaned file: ${file.name}`)
        }
      }
      */
    }
    
    console.log('=== END CLEANUP ===')
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

// ✅ Hapus file dari Supabase Storage berdasarkan public URL (LEGACY - keep for compatibility)
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

// ✅ Alternative method untuk hapus file jika method utama gagal (LEGACY - keep for compatibility)
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