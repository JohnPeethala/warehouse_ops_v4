"use client";

import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { processAndUploadManifest } from "@/app/actions/manifest";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import classNames from "classnames";
import { motion, AnimatePresence } from "framer-motion";

export function ManifestUploader({ variant = 'default', showExpanded = true }: { variant?: 'default' | 'sidebar', showExpanded?: boolean }) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selected);

    try {
      const result = await processAndUploadManifest(formData);

      if (result.success) {
        toast.success(`Uploaded ${result.count} tickets successfully`);
        router.refresh();
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An unexpected error occurred");
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (variant === 'sidebar') {
    return (
      <label
        className={classNames(
          "flex items-center w-full p-2 rounded-lg transition-colors group cursor-pointer",
          isUploading 
            ? "text-zinc-500 cursor-not-allowed" 
            : "text-zinc-300 hover:bg-white/10 hover:text-white"
        )}
        title={!showExpanded ? "Upload Manifest" : undefined}
      >
        <div className="flex items-center justify-center min-w-[32px] group-hover:scale-110 transition-transform">
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
        </div>
        <AnimatePresence>
          {showExpanded && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-3 text-sm font-medium whitespace-nowrap">
              {isUploading ? "Uploading..." : "Upload Manifest"}
            </motion.span>
          )}
        </AnimatePresence>
        <input 
          type="file" 
          accept=".xls,.xlsx" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
        />
      </label>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <label className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer
        ${isUploading ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border shadow-sm' : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'}
      `}>
        {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {isUploading ? "Processing..." : "Upload Tickets"}
        <input 
          type="file" 
          accept=".xls,.xlsx" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
        />
      </label>
    </div>
  );
}
