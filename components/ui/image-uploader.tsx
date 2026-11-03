"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadImageAction, type UploadBucket } from "@/app/actions/upload";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  bucket?: UploadBucket;
  folder?: string;
  shape?: "circle" | "square";
  label?: string;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  bucket = "avatars",
  folder = "players",
  shape = "circle",
  label = "Zdjęcie / Awatar",
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("folder", folder);

    const res = await uploadImageAction(formData);

    if (res.success && res.url) {
      setPreview(res.url);
      onChange(res.url);
    } else {
      alert(res.error || "Nie udało się przesłać pliku.");
    }

    setUploading(false);
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setPreview(null);
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          {label}
        </label>
      )}

      <div className="flex items-center gap-4">
        {/* Kontener podglądu zdjęcia */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex size-20 sm:size-24 cursor-pointer items-center justify-center border-2 border-dashed border-foreground/30 bg-muted/40 transition hover:border-foreground hover:bg-muted overflow-hidden shrink-0",
            shape === "circle" ? "rounded-full" : "rounded-2xl",
            uploading && "opacity-60 cursor-not-allowed"
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt="Podgląd"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
              <ImageIcon className="size-6 stroke-[1.5]" />
              <span className="mt-1 font-mono text-[9px] uppercase font-bold">Wybierz</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-xs">
              <Loader2 className="size-6 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Przyciski i instrukcja */}
        <div className="space-y-1.5 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border-2 border-foreground/20 bg-card px-3 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted active:scale-95 transition disabled:opacity-50"
            >
              <Upload className="size-3.5" />
              <span>{preview ? "Zmień" : "Wgraj z dysku"}</span>
            </button>

            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2 text-xs font-bold text-destructive hover:bg-destructive/20 active:scale-95 transition"
              >
                <X className="size-3.5" />
                <span>Usuń</span>
              </button>
            )}
          </div>

          <p className="font-mono text-[10px] text-muted-foreground">
            PNG, JPG lub WEBP do 4.5 MB.
          </p>
        </div>
      </div>
    </div>
  );
}