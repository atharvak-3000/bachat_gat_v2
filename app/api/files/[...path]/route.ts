import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

const UPLOADS_BASE_PATH =
  process.env.UPLOADS_PATH || "/home/u151079654/domains/bachatgat.webizsquare.com/uploads"

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const filePathArray = resolvedParams.path || []
    if (filePathArray.length === 0) {
      return new NextResponse("File not found", { status: 404 })
    }

    const safeRelativePath = filePathArray.join("/").replace(/\.\./g, "")
    const fullPath = path.join(UPLOADS_BASE_PATH, safeRelativePath)
    const resolvedPath = path.resolve(fullPath)

    if (!resolvedPath.startsWith(path.resolve(UPLOADS_BASE_PATH))) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    try {
      const fileBuffer = await fs.readFile(resolvedPath)
      const ext = path.extname(resolvedPath).toLowerCase()
      const contentType = MIME_TYPES[ext] || "application/octet-stream"

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    } catch {
      return new NextResponse("File not found", { status: 404 })
    }
  } catch (error) {
    return new NextResponse("Internal server error", { status: 500 })
  }
}
