import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImagePreviewDialogProps {
  src?: string;
  alt?: string;
  children: React.ReactNode;
  className?: string;
}

export function ImagePreviewDialog({ src, alt, children, className }: ImagePreviewDialogProps) {
  // If no source is provided, just render children without dialog functionality
  if (!src) return <>{children}</>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className={cn("cursor-zoom-in hover:opacity-90 transition-opacity", className)}>
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] md:max-w-3xl border-none bg-transparent p-0 shadow-none flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            src={src}
            alt={alt || "Image Preview"}
            className="max-h-[85vh] max-w-full rounded-md object-contain shadow-2xl bg-background/10 backdrop-blur-sm"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
