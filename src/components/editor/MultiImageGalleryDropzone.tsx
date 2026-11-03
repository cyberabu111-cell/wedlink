"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  RefreshCw,
  AlertCircle,
  X,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

interface MultiImageGalleryDropzoneProps {
  images: string[];
  onAddImages: (urls: string[]) => void;
  onRemoveImage: (index: number) => void;
  maxImages?: number;
}

export default function MultiImageGalleryDropzone({
  images,
  onAddImages,
  onRemoveImage,
  maxImages = 50,
}: MultiImageGalleryDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith("image/")) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      setErrorMessage("No valid image files detected. Please choose JPG, PNG, WebP, or GIF images.");
      return;
    }

    if (images.length + validFiles.length > maxImages) {
      setErrorMessage(`Gallery can hold a maximum of ${maxImages} images.`);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadStatus(`Uploading 0 of ${validFiles.length} photos...`);

    const uploadedUrls: string[] = [];
    let failedCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadStatus(`Uploading ${i + 1} of ${validFiles.length}: ${file.name}...`);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success && data.url) {
          uploadedUrls.push(data.url);
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error("[MultiImageGalleryDropzone] Upload error for file:", file.name, err);
        failedCount++;
      }
    }

    if (uploadedUrls.length > 0) {
      onAddImages(uploadedUrls);
    }

    if (failedCount > 0) {
      setErrorMessage(
        `${uploadedUrls.length} photos uploaded successfully, but ${failedCount} photos failed to upload.`
      );
    }

    setIsUploading(false);
    setUploadStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [images.length]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* DROPZONE AREA */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative group flex flex-col items-center justify-center p-7 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all duration-200 select-none ${
          isDragging
            ? "border-rose-500 bg-rose-50/70 scale-[1.01] shadow-inner"
            : "border-slate-300 hover:border-rose-400 bg-white hover:bg-slate-50/70 shadow-sm"
        }`}
      >
        {isUploading ? (
          <div className="py-4 flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">{uploadStatus}</p>
              <p className="text-xs text-slate-500">Processing and storing photos in Supabase storage...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-3 group-hover:scale-110 group-hover:bg-rose-100 transition-all duration-200">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">
              Drag and drop gallery photos here
            </p>
            <p className="text-xs text-slate-500 mb-2">
              or <span className="text-rose-600 font-semibold underline underline-offset-2">browse files</span> to select multiple photos at once
            </p>
            <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-medium px-2.5 py-1 bg-slate-100 rounded-full">
              <span>Select multiple JPG, PNG, or WebP files</span>
            </div>
          </>
        )}
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span className="flex-1">{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
