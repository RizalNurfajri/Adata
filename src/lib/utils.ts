import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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

    if (uploadResult.error) return null

    const urlResult = supabase.storage
      .from('materi-pdf')
      .getPublicUrl(filePath)

    return urlResult.data?.publicUrl ?? null
  } catch {
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

    const { data: files, error } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })

    if (error) return false

    const exactMatch = files?.find(file => file.name === fileName)
    if (exactMatch) {
      const { error: deleteError } = await supabase.storage
        .from('materi-pdf')
        .remove([exactMatch.name])

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
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('materi-pdf')
      .list('', { limit: 1000 })

    if (storageError) return

    const { data: dbMaterials, error: dbError } = await supabase
      .from('materials')
      .select('link')
      .not('link', 'is', null)

    if (dbError) return

    const dbFileNames = new Set(
      dbMaterials?.map(material => {
        if (material.link) {
          const urlParts = material.link.split('/')
          return decodeURIComponent(urlParts[urlParts.length - 1])
        }
        return null
      }).filter(Boolean) || []
    )

    const orphanedFiles = storageFiles?.filter(file => 
      !dbFileNames.has(file.name)
    ) || []

    // Uncomment jika ingin menghapus orphaned files
    /*
    for (const file of orphanedFiles) {
      const { error } = await supabase.storage
        .from('materi-pdf')
        .remove([file.name])
    }
    */
  } catch {}
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
