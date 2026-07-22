type BucketName = "kyc-documents" | "payment-proofs"

export async function uploadFile(
  file: File,
  bucket: BucketName,
  pathStr: string
): Promise<string> {
  const validationError = validateFile(file, {
    maxMB: 5,
    types: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
  })
  if (validationError) {
    throw new Error(validationError)
  }

  const ext = file.name.split(".").pop() || "bin"
  const safeFilePath = `${pathStr}.${ext}`

  const formData = new FormData()
  formData.append("file", file)
  formData.append("bucket", bucket)
  formData.append("path", safeFilePath)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || "File upload failed")
  }

  const data = await response.json()
  return data.url
}

export async function uploadKyc(
  file: File,
  memberId: string,
  type: "aadhaar" | "pan" | "photo" | "signature"
): Promise<string> {
  return uploadFile(file, "kyc-documents", `${memberId}/${type}`)
}

export async function uploadPaymentProof(
  file: File,
  memberId: string
): Promise<string> {
  return uploadFile(file, "payment-proofs", `${memberId}/${Date.now()}`)
}

export function validateFile(
  file: File,
  opts: { maxMB?: number; types?: string[] }
): string | null {
  const maxBytes = (opts.maxMB ?? 5) * 1024 * 1024
  if (file.size > maxBytes) return `File must be under ${opts.maxMB ?? 5}MB`
  if (opts.types && !opts.types.includes(file.type))
    return `Invalid file type. Allowed: ${opts.types.join(", ")}`
  return null
}
