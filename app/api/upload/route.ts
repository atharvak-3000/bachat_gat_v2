import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

const UPLOADS_BASE_PATH =
  process.env.UPLOADS_PATH || "/home/u151079654/domains/bachatgat.webizsquare.com/uploads"

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const bucket = (formData.get("bucket") as string) || "general"
    const relPath = (formData.get("path") as string) || ""

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and PDF files are allowed." },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 }
      )
    }

    // Sanitize bucket & relPath to prevent path traversal
    const safeBucket = bucket.replace(/[^a-zA-Z0-9_-]/g, "")
    const ext = path.extname(file.name) || ".bin"
    const safePath = relPath
      .replace(/\.\./g, "")
      .replace(/[^a-zA-Z0-9_\-\/]/g, "")

    const fileName = `${safePath}${safePath.endsWith(ext) ? "" : ext}`
    const targetDir = path.join(UPLOADS_BASE_PATH, safeBucket, path.dirname(fileName))
    const fullPath = path.join(UPLOADS_BASE_PATH, safeBucket, fileName)

    // Verify resolved path stays strictly within UPLOADS_BASE_PATH
    const resolvedPath = path.resolve(fullPath)
    if (!resolvedPath.startsWith(path.resolve(UPLOADS_BASE_PATH))) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 })
    }

    await fs.mkdir(targetDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(fullPath, buffer)

    const publicUrl = `/api/files/${safeBucket}/${fileName}`

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: "File upload failed" }, { status: 500 })
  }
}
