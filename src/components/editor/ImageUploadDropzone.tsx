"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Link as LinkIcon,
  ExternalLink,
  Trash2,
} from "lucide-react";

interface ImageUploadDropzoneProps {
  id?: string;
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  recommendedText?: string;
  aspectRatio?: "portrait" | "landscape" | "square" | "wide";
  allowUrlInput?: boolean;
}

export default function ImageUploadDropzone({
  id = "editor-cover-photo",
  value = "",
  onChange,
  label = "Cover Portrait Photo",
  recommendedText = "Recommended portrait photo (JPG, PNG, WebP up to 10MB).",
  aspectRatio = "portrait",
  allowUrlInput = true,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [manualUrl, setManualUrl] = useState(value);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WebP, GIF, or SVG).");
      return;
    }

    // Validate size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image is larger than 10MB. Please choose a smaller image.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulated initial progress bump for responsive feel
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev && prev < 85 ? prev + 15 : prev));
      }, 200);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload image. Please try again.");
      }

      onChange(data.url);
      setManualUrl(data.url);
      setErrorMessage(null);
    } catch (err: any) {
      console.error("[ImageUploadDropzone] Upload error:", err);
      setErrorMessage(err?.message || "Upload failed. Please check your connection.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 500);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        const file = e.dataTransfer.files[0];
        uploadFile(file);
      }
    },
    []
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      uploadFile(e.clipboardData.files[0]);
    }
  };

  const handleApplyManualUrl = () => {
    const trimmed = manualUrl.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      setErrorMessage("Please enter a valid HTTP or HTTPS image URL.");
      return;
    }
    onChange(trimmed);
    setErrorMessage(null);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setManualUrl("");
    setErrorMessage(null);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case "portrait":
        return "aspect-[4/5] max-w-[260px]";
      case "square":
        return "aspect-square max-w-[260px]";
      case "landscape":
        return "aspect-video w-full";
      case "wide":
        return "aspect-[21/9] w-full";
      default:
        return "aspect-[4/5] max-w-[260px]";
    }
  };

  const hasImage = Boolean(value && value.trim().length > 0);

  return (
    <div className="space-y-2 text-left" onPaste={handlePaste}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-xs font-semibold text-slate-700 cursor-pointer">
            {label}
          </label>
          {allowUrlInput && (
            <button
              type="button"
              onClick={() => setShowUrlFallback(!showUrlFallback)}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{showUrlFallback ? "Hide URL input" : "Paste link instead"}</span>
            </button>
          )}
        </div>
      )}

      {/* Hidden native file input */}
      <input
        id={id}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* MAIN CONTAINER */}
      {!hasImage ? (
        /* ── EMPTY DROPZONE STATE ── */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative group flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer text-center transition-all duration-200 select-none ${
            isDragging
              ? "border-rose-500 bg-rose-50/70 scale-[1.01] shadow-inner"
              : "border-slate-300 hover:border-rose-400 bg-white hover:bg-slate-50/70 shadow-sm"
          }`}
        >
          {isUploading ? (
            <div className="py-6 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-rose-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">Uploading photo...</p>
                <p className="text-xs text-slate-500">Storing image securely in Supabase storage</p>
              </div>
              {uploadProgress !== null && (
                <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-rose-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-3 group-hover:scale-110 group-hover:bg-rose-100 transition-all duration-200">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 mb-1">
                Drag and drop your photo here
              </p>
              <p className="text-xs text-slate-500 mb-3">
                or <span className="text-rose-600 font-semibold underline underline-offset-2">browse files</span> from your computer
              </p>
              <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-medium px-2.5 py-1 bg-slate-100 rounded-full">
                <span>PNG, JPG, WebP or GIF up to 10MB</span>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── IMAGE PREVIEW & ACTIONS STATE ── */
        <div className="relative p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Image Thumbnail */}
            <div className={`relative ${getAspectClass()} rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-200 shrink-0 group`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Selected Portrait"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => {
                  setErrorMessage("Failed to load image preview. Please check the URL or upload a new photo.");
                }}
              />
              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-white/90 text-slate-700 hover:text-slate-900 shadow hover:scale-110 transition-all"
                  title="View full image"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 w-full space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-700">Photo Ready &amp; Connected</span>
              </div>

              <p className="text-[11px] text-slate-500 line-clamp-1 break-all font-mono bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                {value}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5 text-rose-600" />
                      <span>Replace Photo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 bg-white border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              {/* Drag over replace drop area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`mt-2 p-2 rounded-lg border border-dashed text-center transition-all ${
                  isDragging
                    ? "border-rose-500 bg-rose-50 text-rose-700 font-semibold"
                    : "border-slate-200 bg-white/70 text-slate-400 text-[10px]"
                }`}
              >
                {isDragging ? "Drop new photo here to replace" : "Or drag a new file directly here to replace"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR MESSAGE ── */}
      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── OPTIONAL MANUAL URL INPUT ACCORDION ── */}
      {allowUrlInput && showUrlFallback && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-2">
          <label className="text-[11px] font-semibold text-slate-700 block">
            Direct Image Link (HTTPS URL)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              type="button"
              onClick={handleApplyManualUrl}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              Apply
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Paste a public direct link to an image file (e.g. from Unsplash, Google Drive, or Cloudinary).
          </p>
        </div>
      )}

      {recommendedText && (
        <p className="text-[11px] text-slate-400">{recommendedText}</p>
      )}
    </div>
  );
}
