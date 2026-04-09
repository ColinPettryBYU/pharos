import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MediaDropZoneProps {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  required?: boolean;
}

interface UploadResult {
  url: string;
  path: string;
  content_type: string;
  size: number;
}

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, "") ?? "";

export function MediaDropZone({ value, onChange, accept = "image/*,video/*", label = "Attach media", required }: MediaDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File exceeds 100 MB limit");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Only images and videos are supported");
      return;
    }

    setPreview({ url: URL.createObjectURL(file), type: isImage ? "image" : "video" });
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${BASE_URL}/api/admin/upload/media`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(err.message || "Upload failed");
      }

      const result: UploadResult = await response.json();
      onChange(result.url);
      toast.success("Media uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setPreview(null);
      onChange("");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const clear = () => {
    if (preview?.url.startsWith("blob:")) URL.revokeObjectURL(preview.url);
    setPreview(null);
    onChange("");
  };

  if (value && preview) {
    return (
      <div className="space-y-2">
        {label && (
          <p className="text-sm font-medium">
            {label} {required && <span className="text-destructive">*</span>}
          </p>
        )}
        <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
          {preview.type === "image" ? (
            <img src={preview.url} alt="Upload preview" className="w-full max-h-48 object-contain" />
          ) : (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Film className="h-5 w-5" />
              <span className="text-sm">Video uploaded</span>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
            onClick={clear}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </p>
      )}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading…</p>
          </>
        ) : (
          <>
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Drop file here or click to browse</p>
            <p className="text-xs text-muted-foreground">Images or videos up to 100 MB</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
