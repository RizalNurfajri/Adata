import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/integrations/supabase/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ===== Helpers aman untuk path & URL ===== */
const BUCKET = "materi-pdf"

const sanitizeSegment = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s._-]/gi, "")  // buang karakter aneh
    .replace(/\s+/g, "-")             // spasi -> dash
    .replace(/-+/g, "-")              // dash ganda -> satu
    .trim()

const buildPath = (matkul?: string, tipe?: string, filename?: string) => {
  const fname = (filename ?? "").replace(/[\\/]/g, "_") // hindari slash
  if (matkul && tipe) {
    const m = sanitizeSegment(matkul)
    const t = sanitizeSegment(tipe)
    return `${m}/${t}/${fname}`
  }
  return fname
}

/** Ekstrak path relatif dari public URL Supabase.
 * Decode **sekali** biar gak jadi %2520.
 */
export function extractFilePathFromUrl(publicUrl: string): string | null {
  try {
    const decoded = decodeURIComponent(publicUrl)
    const mark = `/storage/v1/object/public/${BUCKET}/`
    const idx = decoded.indexOf(mark)
    if (idx === -1) return null
    return decoded.slice(idx + mark.length)
  } catch {
    return null
  }
}

/* ===== Upload ===== */
export async function uploadToStorage(
  file: File,
  matkul?: string,
  tipe?: string
): Promise<string | null> {
  try {
    const filePath = buildPath(matkul, tipe, file.name)
    if (!filePath) return null

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "application/octet-stream",
      })

    if (error) return null

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
    return data?.publicUrl ?? null
  } catch {
    return null
  }
}

/* ===== Rename/Move =====
   Signature tetap sama. Implementasi diganti ke move() biar atomic & cepat. */
export async function renameFileInStorage(
  oldUrl: string,
  newFileName: string,
  matkul: string,
  tipe: string
): Promise<string | null> {
  try {
    const from = extractFilePathFromUrl(oldUrl)
    if (!from) return null

    // Pastikan nama file baru aman
    const to = buildPath(matkul, tipe, newFileName || from.split("/").pop())

    if (!to || from === to) {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(from)
      return data?.publicUrl ?? null
    }

    // Pindahkan file (otomatis buat folder tujuan kalau belum ada)
    const { error: mvErr } = await supabase.storage.from(BUCKET).move(from, to)
    if (mvErr) {
      console.error("move error:", mvErr, { from, to })
      return null
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(to)
    return data?.publicUrl ?? null
  } catch (error) {
    console.error("Error in renameFileInStorage:", error)
    return null
  }
}

/* ===== Debug (biarkan, tapi rapihin dikit) ===== */
export async function debugStorageContents(): Promise<void> {
  try {
    await supabase.storage.from(BUCKET).list("", { limit: 1000 })
  } catch {}
}

/* ===== Versi ekstraksi alternatif (dipertahankan, tapi konsisten decode sekali) ===== */
function extractFilePathMethod1(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl)
    const pathname = decodeURIComponent(url.pathname)
    const prefix = `/storage/v1/object/public/${BUCKET}/`
    const idx = pathname.indexOf(prefix)
    if (idx === -1) return null
    return pathname.slice(idx + prefix.length)
  } catch {
    return null
  }
}

function extractFilePathMethod2(publicUrl: string): string | null {
  try {
    const match = decodeURIComponent(publicUrl)
      .match(new RegExp(`/storage/v1/object/public/${BUCKET}/(.+)`))
    return match ? match[1] : null
  } catch {
    return null
  }
}

function extractFilePathMethod3(publicUrl: string): string | null {
  try {
    const decoded = decodeURIComponent(publicUrl)
    const mark = `/storage/v1/object/public/${BUCKET}/`
    const idx = decoded.indexOf(mark)
    if (idx === -1) return null
    return decoded.slice(idx + mark.length)
  } catch {
    return null
  }
}

/* ===== Delete (enhanced) ===== */
async function deleteByBruteForceSearch(publicUrl: string): Promise<boolean> {
  try {
    const fileName = decodeURIComponent(publicUrl.split("/").pop() || "")
    if (!fileName) return false

    const searchInFolder = async (folderPath = ""): Promise<string | null> => {
      const { data: items } = await supabase.storage
        .from(BUCKET)
        .list(folderPath, { limit: 1000 })

      if (!items) return null
      for (const item of items) {
        const currentPath = folderPath ? `${folderPath}/${item.name}` : item.name
        // di Supabase, folder tidak punya metadata 'id' khusus yang stabil;
        // asumsi: ada property 'id' falsy untuk folder pada SDK tertentu.
        if ((item as any).id === null) {
          const found = await searchInFolder(currentPath)
          if (found) return found
        } else if (item.name === fileName) {
          return currentPath
        }
      }
      return null
    }

    const foundPath = await searchInFolder()
    if (!foundPath) return false

    const { error } = await supabase.storage.from(BUCKET).remove([foundPath])
    return !error
  } catch {
    return false
  }
}

export async function deleteFromStorageEnhanced(publicUrl: string): Promise<boolean> {
  try {
    await debugStorageContents()
    const filePaths = [
      extractFilePathMethod1(publicUrl),
      extractFilePathMethod2(publicUrl),
      extractFilePathMethod3(publicUrl),
    ].filter(Boolean) as string[]

    for (const fp of filePaths) {
      const { error } = await supabase.storage.from(BUCKET).remove([fp])
      if (!error) return true
    }

    return await deleteByBruteForceSearch(publicUrl)
  } catch {
    return false
  }
}

/* ===== Cleanup orphan (dipertahankan, tapi pakai ekstraksi konsisten) ===== */
export async function cleanupOrphanedFiles(): Promise<void> {
  try {
    const getAllFiles = async (folderPath = ""): Promise<string[]> => {
      const { data: items } = await supabase.storage
        .from(BUCKET)
        .list(folderPath, { limit: 1000 })

      if (!items) return []
      const out: string[] = []
      for (const item of items) {
        const path = folderPath ? `${folderPath}/${item.name}` : item.name
        if ((item as any).id === null) {
          out.push(...(await getAllFiles(path)))
        } else {
          out.push(path)
        }
      }
      return out
    }

    const storageFiles = await getAllFiles()

    const { data: dbMaterials, error: dbError } = await supabase
      .from("materials")
      .select("link")
      .not("link", "is", null)

    if (dbError) return

    const dbFilePaths = new Set(
      (dbMaterials ?? [])
        .map((m: any) => m.link && extractFilePathFromUrl(m.link))
        .filter(Boolean) as string[]
    )

    const orphaned = storageFiles.filter((p) => !dbFilePaths.has(p))
    console.log("Orphaned files found:", orphaned)

    // Hapus jika mau:
    // for (const p of orphaned) await supabase.storage.from(BUCKET).remove([p])
  } catch (e) {
    console.error("Error in cleanup:", e)
  }
}

/* ===== Delete (versi sederhana) ===== */
export async function deleteFromStorage(publicUrl: string): Promise<boolean> {
  try {
    const filePath = extractFilePathFromUrl(publicUrl)
    if (!filePath) return false
    const { error } = await supabase.storage.from(BUCKET).remove([filePath])
    return !error
  } catch {
    return false
  }
}

export async function deleteFromStorageAlternative(publicUrl: string): Promise<boolean> {
  try {
    const filePath = extractFilePathFromUrl(publicUrl)
    if (!filePath) return false
    const { error } = await supabase.storage.from(BUCKET).remove([filePath])
    return !error
  } catch {
    return false
  }
}

/* ===== Auth role (tetap) ===== */
export async function getUserRole(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error || !data.session) return null
    return (data.session.user.user_metadata?.role as string) || null
  } catch {
    return null
  }
}
