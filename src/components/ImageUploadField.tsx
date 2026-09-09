'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadFieldProps {
  id?: string;
  label: string;
  description?: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  error?: string;
  required?: boolean;
}

export default function ImageUploadField({
  id = 'image-upload',
  label,
  description,
  value = '',
  onChange,
  folder = '247sparkle/onboarding',
  error,
  required = false,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(value);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    if (value) {
      setPreviewUrl(value);
    }
  }, [value]);

  const handleFile = async (file: File) => {
    setLocalError('');

    // Client-side validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      const msg = 'Invalid file format. Please upload a JPEG, PNG, or WebP image.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const msg = 'File is too large. Maximum size is 5MB.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setPreviewUrl(data.url);
      onChange(data.url);
      toast.success('Photo uploaded successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image. Please try again.';
      setLocalError(msg);
      toast.error(msg);
      setPreviewUrl(value); // Revert to previous value
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setLocalError('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayError = error || localError;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {previewUrl && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 transition"
          >
            <Trash2 size={13} />
            Remove photo
          </button>
        )}
      </div>

      {description && <p className="text-xs text-slate-500">{description}</p>}

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
        disabled={isUploading}
      />

      <div
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition text-center ${
          isDragOver
            ? 'border-[#1A0A5E] bg-[#1A0A5E]/5'
            : displayError
              ? 'border-red-400 bg-red-50/50'
              : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-100/50'
        }`}
      >
        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white shadow-md ring-2 ring-[#1A0A5E]/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Uploaded face preview"
                className="h-full w-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="text-xs">
              {isUploading ? (
                <span className="font-medium text-slate-600 flex items-center gap-1 justify-center">
                  <Loader2 size={14} className="animate-spin text-[#1A0A5E]" /> Uploading photo...
                </span>
              ) : (
                <span className="font-medium text-emerald-600 flex items-center gap-1 justify-center">
                  <CheckCircle2 size={14} /> Photo uploaded. Click to change.
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xs border border-slate-200 text-slate-600 group-hover:text-[#1A0A5E] group-hover:border-[#1A0A5E]/30 transition">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-[#1A0A5E]" />
              ) : (
                <Camera className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {isUploading ? 'Uploading...' : 'Click or drag & drop to upload'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Front-facing photo &bull; JPEG, PNG or WebP &bull; Max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {displayError && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle size={13} className="shrink-0" />
          {displayError}
        </p>
      )}
    </div>
  );
}
