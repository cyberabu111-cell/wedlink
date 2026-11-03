export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageUpload(
  file: { size: number; type: string } | null | undefined
): UploadValidationResult {
  if (!file) {
    return { valid: false, error: "No image file provided." };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Empty file provided." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Image size exceeds 10MB limit." };
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or SVG image.",
    };
  }

  return { valid: true };
}
