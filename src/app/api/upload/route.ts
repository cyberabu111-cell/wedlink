import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateImageUpload, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/upload/validation";

export const dynamic = "force-dynamic";

const BUCKET_NAME = "wedding-media";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    const validation = validateImageUpload(file);
    if (!validation.valid || !file) {
      return NextResponse.json(
        { success: false, error: validation.error || "No image file provided." },
        { status: 400 }
      );
    }

    let user: any = null;
    try {
      const supabase = await createClient();
      const authRes = await supabase.auth.getUser();
      user = authRes.data?.user || null;
    } catch {
      // Allow guest uploads for drafting/previewing
    }

    const adminClient = await createAdminClient();

    // Ensure bucket exists
    try {
      const { data: bucket } = await adminClient.storage.getBucket(BUCKET_NAME);
      if (!bucket) {
        await adminClient.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
        });
      }
    } catch (bucketErr) {
      console.warn("[upload] Note checking/creating bucket:", bucketErr);
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const sanitizedExt = fileExt.replace(/[^a-z0-9]/g, "");
    const randomHash = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now();
    const fileName = `${timestamp}-${randomHash}.${sanitizedExt}`;

    const folder = user?.id ? `users/${user.id}` : "uploads";
    const storagePath = `${folder}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload] Supabase storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = adminClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (err: any) {
    console.error("[upload] Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error during upload." },
      { status: 500 }
    );
  }
}
